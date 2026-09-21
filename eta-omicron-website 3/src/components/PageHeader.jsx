export default function PageHeader({ title, subtitle }) {
  return (
    <div className="bg-gradient-to-br from-omega-purple to-omega-purple-dark text-white">
      <div className="container-page py-14">
        <h1 className="font-display text-3xl md:text-4xl font-bold">{title}</h1>
        {subtitle && <p className="mt-3 text-white/80 max-w-2xl">{subtitle}</p>}
      </div>
    </div>
  )
}
