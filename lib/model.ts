export type Block = {
  id: number;
  uid: string;
  string: string;
  order: number;
  page: string;
  children: Block[];
  editTime?: number;
  createTime?: number;
};

export type BlockDb = {
  ":db/id": number;
  ":block/uid": string;
  ":block/string": string;
  ":block/order": number;
  ":block/page": string;
  ":block/children": { ":db/id": number }[];
  ":edit/time": number;
  ":create/time": number;
  ":create/user": { ":db/id": number };
  ":edit/user": { ":db/id": number };
  ":log/id": number;
};

export type BlockWithChildrenIds = Omit<Block, "children"> & {
  children: number[];
};

export type BlockWithChildren = Omit<Block, "children"> & {
  children: Block[];
};

export type Page = {
  id: number;
  uid: string;
  title: string;
  children: number[];
  editTime: number;
  createTime: number;
};

export type PageWithChildren = Omit<Page, "children"> & {
  children: Block[];
};

export type PageDb = {
  ":db/id": number;
  ":block/uid": string;
  ":node/title": string;
  ":block/children": { ":db/id": number }[];
  ":edit/time": number;
  ":create/time": number;
  ":create/user": { ":db/id": number };
  ":edit/user": { ":db/id": number };
  ":log/id": number;
};
