export const Footer = () => {
  return (
    <footer className="w-full bg-[#202020] py-6">
      <div className="container mx-auto flex items-center justify-center">
        <a
          href="https://syntaxlab.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-80"
        >
          <img
            src="/powered-by-syntaxlab.svg"
            alt="Powered by SyntaxLab"
            className="h-12"
          />
        </a>
      </div>
    </footer>
  );
};
