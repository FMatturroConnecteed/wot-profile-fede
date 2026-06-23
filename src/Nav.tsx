export default function Nav() {
  return (
    <nav className="fixed w-full bg-gray-800 border-b border-gray-700 p-4">
      <div className="mx-auto flex justify-between">
        <div className="text-amber-400 font-bold">WoT Stats</div>
        <div className="flex gap-4">
          <a href="/" className="text-gray-300 hover:text-white">Home</a>
          <a href="/tanks" className="text-gray-300 hover:text-white">Tankpedia</a>
          <a href="/accounts" className="text-gray-300 hover:text-white">Accounts</a>
        </div>
      </div>
    </nav>
  );
}
