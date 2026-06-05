import request from '@ray/common/utils/request';

export async function apiBugImport(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/issue/bugs/import', {
    method: 'POST',
    body: formData,
  });
}
