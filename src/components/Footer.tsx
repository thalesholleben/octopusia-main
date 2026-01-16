export const Footer = () => {
  return (
    <footer className="w-full py-6" style={{ backgroundColor: '#0d0a09', borderTop: '2px solid #212121' }}>
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
          />
        </a>
      </div>
    </footer>
  );
};
