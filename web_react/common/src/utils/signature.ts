import Base64 from 'base-64';
import CryptoJS from 'crypto-js';
import forge from 'node-forge';
import { UUID } from 'uuidjs';
//过滤null、undefined及空字符
const filterEmptyValues = (obj, { deleteWhiteSpace = true } = {}) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      if (value === '' && deleteWhiteSpace) return false;
      return true;
    }),
  );
};
const generateSecret = async () => {
  try {
    const response = await fetch('/img/RVRUAYdCGeYNBWoKiIwB.svg');
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    // 将二进制数据转换为一个Uint8Array
    const uint8Array = new Uint8Array(buffer);
    // 使用CryptoJS库计算SHA-256哈希
    const hash = CryptoJS.SHA256(uint8Array);
    // 将哈希值转换为十六进制字符串作为SECRET
    const secret32 = hash.toString(CryptoJS.enc.Hex);
    const secret =
      secret32.slice(0, 8) +
      '-' +
      secret32.slice(8, 12) +
      '-' +
      secret32.slice(12, 16) +
      '-' +
      secret32.slice(16, 20) +
      '-' +
      secret32.slice(20, 32);
    return secret;
  } catch (error) {
    return console.error('Error loading image:', error);
  }
};
//@ts-ignore
const SECRET = await generateSecret();
const generateSign = (timestamp, nonce, payload, secret) => {
  // 计算 sha256
  const str = payload + nonce;
  let sha256 = CryptoJS.SHA256(str);
  sha256 = CryptoJS.enc.Base64.stringify(sha256);
  let digest = 'SHA-256=' + sha256;
  let qq = 'x-date: ' + timestamp + '\ndigest: ' + digest;
  // hmac_sha256加密
  let signature = CryptoJS.HmacSHA256(qq, secret);
  signature = CryptoJS.enc.Base64.stringify(signature);
  return signature;
};

//将PEM格式的公钥转换为node-forge可用的格式
const pemToForgePublicKey = (pem) => {
  return forge.pki.publicKeyFromPem(pem);
};

const RSAEncrypt = (content, pubKey, pb_len = 4096) => {
  let decPubKey = Base64.decode(pubKey);
  const publicKey = pemToForgePublicKey(decPubKey);
  const contentBytes = forge.util.encodeUtf8(content);
  let contentLength = contentBytes.length;
  //默认4096bit证书
  //32字节为SHA-256实际输出长度
  const hashLength = 32;
  //分段加密步长keySize / 8 - 2 * hashLength - 2，总填充和hash的长度为2*32字节，再加上OAEP固定开销2字节
  const maxEncryptBlockSize = pb_len / 8 - 2 * hashLength - 2;
  try {
    if (contentLength <= maxEncryptBlockSize) {
      return forge.util.encode64(
        publicKey.encrypt(contentBytes, 'RSA-OAEP', {
          md: forge.md.sha256.create(),
        }),
      );
    }
    let chunks = [];
    for (let i = 0; i < contentLength; i += maxEncryptBlockSize) {
      //截取分段加密长的的字符串
      let segment = contentBytes.slice(i, i + maxEncryptBlockSize);
      //npm-forge加密，使用OAEP填充
      let encryptedSegment = publicKey.encrypt(segment, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
      });
      chunks.push(encryptedSegment);
    }
    //base64加密
    return forge.util.encode64(chunks.join(''));
  } catch (ex) {
    console.log(ex);
    return false;
  }
};

export { RSAEncrypt, SECRET };
//请求添加签名
export default function signature(request) {
  //@ts-ignore
  const initialState = window?.umi_plugin_model_global;
  if (!(request.body instanceof FormData)) {
    request.body = filterEmptyValues(request.body, request);
  }
  const { url } = request;
  const { method = 'POST' } = request;
  if (
    [
      '/api/cms/user/login',
      '/api/v1/account/changepwd',
      '/api/v1/account/authverify',
      '/api/v1/alert/mail/save',
      '/api/v1/system/upgrade/ftp/system',
      '/api/v1/system/upgrade/ftp/patch',
      '/api/v1/system/upgrade/ftp/waf',
      '/api/v1/webapipolicy/assetlist/export',
      '/api/v1/account/save',
      '/api/v1/system/snmp/snmpconfig/save',
      '/api/v1/system/backup/export',
      '/api/v1/system/radius/config/save',
      '/api/v1/system/info/config/save',
      '/api/v1/intelligence/source/save',
      '/api/v1/system/login/config/test',
      '/api/v1/system/upgrade/online/waf/save',
      '/api/v1/webhoneypot/ipSource/configSave',
      '/api/v1/webscanner/save',
      '/api/v1/webhoneypot/ipsource/configsave',
      '/api/v1/ha/configsync/worker/update',
      '/api/v1/ha/configsync/worker/add',
      '/api/v1/ha/configsync/workerauth/update',
      '/api/v1/ha/configsync/workerauth/add',
      '/api/v1/system/faultcollect/export',
      '/api/v1/system/faultcollect/export/download',
      '/api/v1/network/device/node/config/save',
    ].includes(url)
  ) {
    const payload = request.body;
    if (!(payload instanceof FormData)) {
      const payloadStr = JSON.stringify(payload);
      request.body = {
        message: RSAEncrypt(payloadStr, initialState.pb, initialState.pb_len),
      };
    }
  }
  let sgin_data = {};
  if (request.body instanceof FormData) {
    request.body.forEach((value, key) => {
      if (!(value instanceof File || value instanceof Blob))
        sgin_data[key] = value;
    });
  } else {
    sgin_data = { ...request.body };
  }
  //sign增加url，防止url被篡改，导致其他接口暴露
  sgin_data['reqCheckUrl'] = url;
  //@ts-ignore
  const timestamp = Date.parse(new Date()) / 1000;
  const nonce = UUID.genV4();
  const sgin = generateSign(
    timestamp,
    nonce,
    JSON.stringify(sgin_data),
    SECRET,
  );
  const headers = {
    Accept: 'application/json',
    'X-CSRFtoken': sessionStorage.getItem('x-csrftoken'),
    'X-AppKey': 'frontend',
    'X-Sign': sgin,
    'X-TimeStamp': timestamp,
    'X-Nonce': nonce,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1',
    ...request.headers,
  };

  //如果使用fetch请求需要设置Content-Type且需要转换body:JSON.stringify(data)
  //使用FormData提交 需要把数据给body提交
  //data需添加到请求体的body中
  if (!(request.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    request.body = JSON.stringify(request.body);
  }
  request['method'] = method;
  request['headers'] = headers;
  request['credentials'] = 'include'; //允许跨域请求中携带cookie
  return request;
}
