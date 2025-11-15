declare module "diff" {
  export function diffLines(
    oldStr: string,
    newStr: string,
  ): Array<{
    value: string;
    added?: boolean;
    removed?: boolean;
  }>;
}
