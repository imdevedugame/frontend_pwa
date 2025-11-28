import Link from 'next/link'

interface Category {
  id: number
  name: string
  icon: string
}

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/products?category=${category.id}`}
      className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white hover:bg-[rgb(240,253,244)] border border-[rgb(228,228,231)] hover:border-[rgb(34,197,94)] transition-all"
    >
      <span className="text-3xl">{category.icon}</span>
      <span className="text-xs font-medium text-center text-[rgb(39,39,46)] line-clamp-2">
        {category.name}
      </span>
    </Link>
  )
}
