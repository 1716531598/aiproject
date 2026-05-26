import { formatMessage } from '@umijs/max';
const ipv4Address =
  /^((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))$/;
const ipv6Address =
  /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
//空白字符
// const validator_whitespace = /(\s)/;
//首位空白字符
export const validator_head_tail_whitespace = /(^\s)|(\s$)/;
export function validPassword(rule, value, callback) {
  const {
    required,
    min,
    max = 32,
    comp,
    char = '!@#%-',
    nullTips = 'validation.password.required',
  } = rule; //0:低，1:中，2：高,密码默认最大32位
  const limitnum_low = /^(?=.*[a-z_])(?=.*\d)[\S]{0,}$/gim;
  // const limitnum_mid =
  //   /^(?![\d]+$)(?![a-zA-Z]+$)(?![!@#%-]+$)[\da-zA-Z!@#%-]{0,}$/gim;
  // const limitnum_high =
  //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#%-])[A-Za-z\d!@#%-]{0,}$/gim;
  const limitnum_mid = new RegExp(
    `^(?=.*[a-z])` +
      `(?=.*[A-Z])` +
      `(?=.*\\d)` +
      `(?=.*[${char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}])` +
      `(?!.*([${char}\\w])\\1\\1)` +
      `(?!.*[^a-zA-Z0-9${char}])`,
    'i',
  );
  const limitnum_high = new RegExp(
    `^(?=.*[a-z])` +
      `(?=.*[A-Z])` +
      `(?=.*\\d)` +
      `(?=.*[${char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}])` +
      `(?!.*([${char}\\w])\\1\\1)` +
      `(?!.*[^a-zA-Z0-9${char}])`,
  );
  const l = value?.length || 0;
  const test_l = limitnum_low.test(value);
  const test_m = limitnum_mid.test(value);
  const test_h = limitnum_high.test(value);

  if (!l) {
    if (required) callback(formatMessage({ id: nullTips }));
    else callback();
  } else if (
    comp === 0 &&
    (!test_l || value.length < min || value.length > max)
  ) {
    callback(
      formatMessage({
        id: 'validator.password.low',
        values: { min: min, max: max },
      }),
    );
  } else if (
    comp === 1 &&
    (!test_m || value.length < min || value.length > max)
  ) {
    callback(
      formatMessage({
        id: 'validator.strict.mid',
        values: { min: min, max: max, char: char },
      }),
    );
  } else if (
    comp === 2 &&
    (!test_h || value.length < min || value.length > max)
  ) {
    callback(
      formatMessage({
        id: 'validator.strict.high',
        values: { min: min, max: max, char: char },
      }),
    );
  } else {
    callback();
  }
}
export function inputWhitespace(rule, value, callback) {
  if (!validator_head_tail_whitespace.test(value)) {
    callback();
  } else {
    callback(formatMessage({ id: 'validator.whitespace' }));
  }
}
// 校验metric范围
export function validmetric(rule, value, callback, ipTypeValue) {
  const ipv4range = /\b([0-9]|[1-9][0-9]|100)\b/;
  const ipv6range = /\b([1-9]|[1-9][0-9]|100)\b/;
  if ((ipTypeValue && value) || value === 0) {
    if (ipv4Address.test(ipTypeValue) && !ipv4range.test(value)) {
      return Promise.reject(new Error('请输入0-100的整数'));
    } else if (ipv6Address.test(ipTypeValue) && !ipv6range.test(value)) {
      return Promise.reject(new Error('请输入1-100的整数'));
    } else {
      return Promise.resolve();
    }
  }
  return Promise.resolve();
}
// 检验子网掩码
export function validMaskType(rule, value, callback) {
  const mask = /^[1][0-2][0-8]$|^[1-9][0-9]$|^[0-9]$/;
  if (value && !(ipv4Address.test(value) || mask.test(value))) {
    return Promise.reject(new Error('请输入正确的子网掩码'));
  }
  return Promise.resolve();
}
// 校验ip格式是否合规 v4和v6格式并存
export function validIpType(rule, value, callback) {
  if (value) {
    if (ipv4Address.test(value) || ipv6Address.test(value)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('请输入正确的IP地址！'));
  }
  return Promise.resolve();
}
export const common64Rule = {
  max: 64,
  byte: false,
  // validator: validChart,
};
/**通用数字格式校验--整数
  required:必选 默认false
  min:最小值
  max:最大值
*/
export function validNumber(rule, value, callback) {
  const { required, min = 0, max } = rule;
  const r_int = /^(0|[1-9][0-9]*)$/; //0或非0开头的整数
  const l = value || value === 0 ? String(value)?.length : 0;
  if (!l) {
    if (required) callback('请输入');
    else callback();
  } else if (!r_int.test(value) || value < min || value > max) {
    callback(`支持输入范围为${min}-${max}`);
  } else {
    callback();
  }
}
export function mask(rule, value, callback) {
  const { banZero = false } = rule;
  const mask =
    /^(254|252|248|240|224|192|128|0)\.0\.0\.0$|^255\.(254|252|248|240|224|192|128|0)\.0\.0$|^255\.255\.(254|252|248|240|224|192|128|0)\.0$|^255\.255\.255\.(255|254|252|248|240|224|192|128|0)$/;
  if (banZero && value === '0.0.0.0') {
    callback(formatMessage({ id: 'Subnet mask cannot be 0.0.0.0' }));
  }
  if (!value) {
    callback();
  } else if (mask.test(value)) {
    callback();
  } else {
    callback(formatMessage({ id: 'Subnet mask format error' }));
  }
}
