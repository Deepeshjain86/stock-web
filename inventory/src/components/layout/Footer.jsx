const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-5 mt-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-2 text-center">
        <p className="text-sm text-slate-400">
          © {currentYear} Created by{" "}
          <a
            href="https://www.technovani.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-400 hover:text-blue-300 transition duration-300"
          >
            TechnoVani Pvt. Ltd.
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;