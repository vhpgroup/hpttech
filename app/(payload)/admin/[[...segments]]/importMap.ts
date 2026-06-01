import { CollectionCards as CollectionCards_f937fd27 } from "@payloadcms/next/rsc";
import {
  LexicalDiffComponent as LexicalDiffComponent_10877c26,
  RscEntryLexicalCell as RscEntryLexicalCell_10877c26,
  RscEntryLexicalField as RscEntryLexicalField_10877c26,
} from "@payloadcms/richtext-lexical/rsc";
import { S3ClientUploadHandler as S3ClientUploadHandler_9f25f5a3 } from "@payloadcms/storage-s3/client";
import type { ImportMap } from "payload";

export const importMap: ImportMap = {
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f937fd27,
  "@payloadcms/richtext-lexical/rsc#LexicalDiffComponent": LexicalDiffComponent_10877c26,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell_10877c26,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField_10877c26,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_9f25f5a3,
};
