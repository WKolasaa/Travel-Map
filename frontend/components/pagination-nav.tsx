import Link from "next/link";

type PaginationNavProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  params?: Record<string, string | undefined>;
};

function buildHref(basePath: string, page: number, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      continue;
    }
    searchParams.set(key, value);
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function visiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

export function PaginationNav({ basePath, currentPage, totalPages, totalItems, pageSize, itemLabel, params = {} }: PaginationNavProps) {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);
  const pages = visiblePages(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-line/70 bg-panel/65 px-5 py-4 shadow-panel">
      <p className="text-sm text-cloud/68">
        Showing {startItem}-{endItem} of {totalItems} {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={buildHref(basePath, currentPage - 1, params)}
          aria-disabled={currentPage === 1}
          className="rounded-full border border-line/70 px-4 py-2 text-cloud/80 aria-[disabled=true]:pointer-events-none aria-[disabled=true]:opacity-40"
        >
          Previous
        </Link>
        {pages[0] > 1 ? <span className="px-2 text-cloud/45">...</span> : null}
        {pages.map((page) => (
          <Link
            key={page}
            href={buildHref(basePath, page, params)}
            aria-current={page === currentPage ? "page" : undefined}
            className="rounded-full border border-line/70 px-4 py-2 text-cloud/80 aria-[current=page]:border-accentBrand aria-[current=page]:bg-accentBrand aria-[current=page]:text-ink"
          >
            {page}
          </Link>
        ))}
        {pages[pages.length - 1] < totalPages ? <span className="px-2 text-cloud/45">...</span> : null}
        <Link
          href={buildHref(basePath, currentPage + 1, params)}
          aria-disabled={currentPage === totalPages}
          className="rounded-full border border-line/70 px-4 py-2 text-cloud/80 aria-[disabled=true]:pointer-events-none aria-[disabled=true]:opacity-40"
        >
          Next
        </Link>
      </div>
    </div>
  );
}