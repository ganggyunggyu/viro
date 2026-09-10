import axios from 'axios';
import { authError } from '@/shared/lib/dabut-auth/contracts';
import { createDabutClient, type IdentityRequest } from '@/shared/lib/dabut-auth/client';

const requestIdentity: IdentityRequest = async (method, path, token, data) => {
  try {
    const { data: response } = await axios.request<unknown>({
      method, baseURL: process.env.DABUT_AUTH_BASE_URL || 'https://blog-analyzer.fly.dev', url: path,
      data, timeout: 10_000, maxRedirects: 0, maxContentLength: 65_536, maxBodyLength: 16_384,
      headers: { 'X-Dabut-Service': 'viro', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    return response;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 401 || status === 403) throw authError(status, 'identity_rejected', '다붓 계정 또는 서비스 이용 권한을 확인하세요.');
    if (status === 409) throw authError(409, 'username_exists', '이미 사용 중인 다붓 아이디입니다.');
    if (status === 400 || status === 422) throw authError(400, 'invalid_credentials', '아이디는 2~40자, 비밀번호는 8자 이상으로 입력하세요.');
    throw authError(503, 'identity_unavailable', '다붓 인증 서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요.');
  }
};

export const dabutClient = createDabutClient(requestIdentity);
