export interface ExcelRow {
  [key: string]: string | number;
}

export interface TextConfig {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right" | "justify";
  verticalAlign?: "top" | "middle" | "bottom";
  maxWidth?: number;
}

export interface ImageConfig {
  id: string;
  url: string;
  publicId: string;
  name: string;
  attachmentName?: string;
  texts: TextConfig[];
}

export interface EmailTemplate {
  subject: string;
  bodyHtml: string;
  images: ImageConfig[];
}

export interface EmailAccount {
  id: string;
  emailAddress: string;
  orgName: string;
}
