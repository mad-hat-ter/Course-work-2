export type PaginationItem = number | 'ellipsis';

export const getPaginationItems = (
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): PaginationItem[] => {
  if (totalPages <= 1) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: PaginationItem[] = [1];
  const leftSibling = Math.max(2, currentPage - siblingCount);
  const rightSibling = Math.min(totalPages - 1, currentPage + siblingCount);

  if (leftSibling > 2) {
    items.push('ellipsis');
  }

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    items.push(page);
  }

  if (rightSibling < totalPages - 1) {
    items.push('ellipsis');
  }

  items.push(totalPages);
  return items;
};
