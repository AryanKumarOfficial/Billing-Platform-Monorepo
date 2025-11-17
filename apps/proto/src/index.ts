import {join} from 'path';


export const PROTO_DIR = join(__dirname, 'proto');

export const USER_PROTO_PATH = join(PROTO_DIR, 'user.proto');
export const INVOICE_PROTO_PATH = join(PROTO_DIR, 'invoice.proto');

export const USER_SERVICE_NAME = 'UserService';
export const INVOICE_SERVICE_NAME = 'InvoiceService';

export const USER_PACKAGE_NAME = 'user';
export const INVOICE_PACKAGE_NAME = 'invoice';
