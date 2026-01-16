export const Footer = () => {
  return (
    <footer className="w-full py-8" style={{ backgroundColor: '#0d0a09', borderTop: '1px solid #151515' }}>
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
            style={{ width: '120px', height: 'auto' }}
          />
        </a>
      </div>
    </footer>
  );
};
