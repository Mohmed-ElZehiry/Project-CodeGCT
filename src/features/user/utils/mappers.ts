import type { BackupFile, FolderNode } from "../types/user";

/**
 * يحول الحجم من بايت إلى ميجابايت (برقم عشري محدد)
 */
function bytesToMB(bytes: number): number {
  return +(bytes / (1024 * 1024)).toFixed(2);
}

/**
 * يبني شجرة مجلدات من قائمة ملفات
 * @param files قائمة الملفات
 * @returns FolderNode[] تمثل البنية الشجرية
 */
export function buildFolderTree(files: BackupFile[]): FolderNode[] {
  type FolderNodeInternal = FolderNode & { childrenMap?: Record<string, FolderNodeInternal> };

  const root: Record<string, FolderNodeInternal> = {};

  files.forEach((file) => {
    const parts = file.path.split("/");
    let currentLevel = root;

    parts.forEach((part, idx) => {
      const isFile = idx === parts.length - 1;

      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          files: 0,
          sizeMB: 0,
          lastModified: file.lastModified || new Date().toISOString(),
        } as FolderNodeInternal;
      }

      if (isFile) {
        // تحديث بيانات الملف
        currentLevel[part].files = 1;
        currentLevel[part].sizeMB = bytesToMB(file.size);
      } else {
        // النزول للمستوى التالي
        if (!currentLevel[part].childrenMap) {
          currentLevel[part].childrenMap = {};
        }
        currentLevel = currentLevel[part].childrenMap as Record<string, FolderNodeInternal>;
      }
    });
  });

  /**
   * يحول الـ object إلى array ويجمع الملفات والأحجام
   */
  function normalize(nodeMap: Record<string, FolderNodeInternal>): FolderNode[] {
    return Object.values(nodeMap).map((node) => {
      if (node.childrenMap) {
        const childrenArr = normalize(node.childrenMap);
        const totalFiles = childrenArr.reduce((a, c) => a + c.files, 0) + node.files;
        const totalSize = childrenArr.reduce((a, c) => a + c.sizeMB, 0) + node.sizeMB;
        return {
          ...node,
          files: totalFiles,
          sizeMB: +totalSize.toFixed(2),
          children: childrenArr,
        };
      }
      return node;
    });
  }

  return normalize(root);
}
