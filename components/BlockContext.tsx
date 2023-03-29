import { createContext } from "react";

const BlockContext = createContext<{
  indent: (uid: string) => void;
  dedent: (uid: string) => void;
  createBelow: (uid: string) => void;
  deleteBlock: (uid: string) => void;
  updateBlockString: (uid: string, string: string) => void;
  toggleBlockOpen: (uid: string) => void;
  isActiveBlock: (uid: string) => boolean;
  setActiveBlock: (uid: string | null) => void;
}>(null);

export default BlockContext;
