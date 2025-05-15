export const PARENT_PATH_RE = /([^/]+)\/[^/]+\/*$/;
export const BASENAME_RE = /.*\/(.*)/;
export const FILE_EXT_RE = /\.([^.]+$)/;

export const CSS_UNIT_RE = /\d+(?:cm|mm|in|px|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)(?!.)/;

export const VALID_URL_RE = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-/]))?/;
export const URL_SCHEME_RE = /^(?:https?:|file:\/)\/\//;
export const NOSCHEME_URL_RE = /^[^#?/.]+(?:\.[^#?/.]+)+(?:\/\S*)?/;

export const NON_ASCII_RE = /\P{ASCII}/u