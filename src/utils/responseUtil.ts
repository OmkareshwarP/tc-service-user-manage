/* eslint-disable @typescript-eslint/no-explicit-any */
interface ResponseData {
  error: boolean;
  message: string;
  statusCode: number;
  errorCodeForClient: string;
  data: any;
}

const generateResponse = (error: boolean, message: string, errorCodeForClient: string, statusCode: number, data: any) => {
  const responseData: ResponseData = {
    error,
    message,
    errorCodeForClient,
    statusCode,
    data,
  };
  return responseData;
};

export { generateResponse };
