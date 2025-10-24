import { localApi } from './localApi';

// For now, these integrations are not implemented in the local API
// You would need to add these endpoints to your backend server

export const Core = {
  InvokeLLM: async (params) => {
    // Not implemented in local API
    throw new Error('InvokeLLM not implemented in local API');
  },

  SendEmail: async (params) => {
    // Not implemented in local API
    throw new Error('SendEmail not implemented in local API');
  },

  UploadFile: async (file) => {
    return localApi.uploadFile(file);
  },

  GenerateImage: async (params) => {
    // Not implemented in local API
    throw new Error('GenerateImage not implemented in local API');
  },

  ExtractDataFromUploadedFile: async (params) => {
    // Not implemented in local API
    throw new Error('ExtractDataFromUploadedFile not implemented in local API');
  },

  CreateFileSignedUrl: async (params) => {
    // Not implemented in local API
    throw new Error('CreateFileSignedUrl not implemented in local API');
  },

  UploadPrivateFile: async (file) => {
    return localApi.uploadFile(file);
  }
};

export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;
