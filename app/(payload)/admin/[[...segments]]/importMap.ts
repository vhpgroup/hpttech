import { CollectionCards as CollectionCards_f937fd27 } from "@payloadcms/next/rsc";
import AfterNavLinks from "@/components/payload/AfterNavLinks";
import Dashboard from "@/components/payload/Dashboard";
import NavIcon from "@/components/payload/NavIcon";
import NavLogo from "@/components/payload/NavLogo";
import {
  LexicalDiffComponent as LexicalDiffComponent_10877c26,
  RscEntryLexicalCell as RscEntryLexicalCell_10877c26,
  RscEntryLexicalField as RscEntryLexicalField_10877c26,
} from "@payloadcms/richtext-lexical/rsc";
import {
  AlignFeatureClient as AlignFeatureClient_e70f5e05,
  BlockquoteFeatureClient as BlockquoteFeatureClient_e70f5e05,
  BoldFeatureClient as BoldFeatureClient_e70f5e05,
  ChecklistFeatureClient as ChecklistFeatureClient_e70f5e05,
  FixedToolbarFeatureClient as FixedToolbarFeatureClient_e70f5e05,
  HeadingFeatureClient as HeadingFeatureClient_e70f5e05,
  HorizontalRuleFeatureClient as HorizontalRuleFeatureClient_e70f5e05,
  IndentFeatureClient as IndentFeatureClient_e70f5e05,
  InlineCodeFeatureClient as InlineCodeFeatureClient_e70f5e05,
  InlineToolbarFeatureClient as InlineToolbarFeatureClient_e70f5e05,
  ItalicFeatureClient as ItalicFeatureClient_e70f5e05,
  LinkFeatureClient as LinkFeatureClient_e70f5e05,
  OrderedListFeatureClient as OrderedListFeatureClient_e70f5e05,
  ParagraphFeatureClient as ParagraphFeatureClient_e70f5e05,
  RelationshipFeatureClient as RelationshipFeatureClient_e70f5e05,
  StrikethroughFeatureClient as StrikethroughFeatureClient_e70f5e05,
  SubscriptFeatureClient as SubscriptFeatureClient_e70f5e05,
  SuperscriptFeatureClient as SuperscriptFeatureClient_e70f5e05,
  UnderlineFeatureClient as UnderlineFeatureClient_e70f5e05,
  UnorderedListFeatureClient as UnorderedListFeatureClient_e70f5e05,
  UploadFeatureClient as UploadFeatureClient_e70f5e05,
} from "@payloadcms/richtext-lexical/client";
import { S3ClientUploadHandler as S3ClientUploadHandler_9f25f5a3 } from "@payloadcms/storage-s3/client";
import type { ImportMap } from "payload";

export const importMap: ImportMap = {
  "@/components/payload/AfterNavLinks#default": AfterNavLinks,
  "@/components/payload/Dashboard#default": Dashboard,
  "@/components/payload/NavIcon#default": NavIcon,
  "@/components/payload/NavLogo#default": NavLogo,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f937fd27,
  "@payloadcms/richtext-lexical/client#AlignFeatureClient": AlignFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#BlockquoteFeatureClient": BlockquoteFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#BoldFeatureClient": BoldFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#ChecklistFeatureClient": ChecklistFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient": FixedToolbarFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#HeadingFeatureClient": HeadingFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient": HorizontalRuleFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#IndentFeatureClient": IndentFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#InlineCodeFeatureClient": InlineCodeFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient": InlineToolbarFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#ItalicFeatureClient": ItalicFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#LinkFeatureClient": LinkFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#OrderedListFeatureClient": OrderedListFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#ParagraphFeatureClient": ParagraphFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#RelationshipFeatureClient": RelationshipFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#StrikethroughFeatureClient": StrikethroughFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#SubscriptFeatureClient": SubscriptFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#SuperscriptFeatureClient": SuperscriptFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#UnderlineFeatureClient": UnderlineFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#UnorderedListFeatureClient": UnorderedListFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/client#UploadFeatureClient": UploadFeatureClient_e70f5e05,
  "@payloadcms/richtext-lexical/rsc#LexicalDiffComponent": LexicalDiffComponent_10877c26,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell_10877c26,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField_10877c26,
  "@payloadcms/storage-s3/client#S3ClientUploadHandler": S3ClientUploadHandler_9f25f5a3,
};
