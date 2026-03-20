import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathDisplayProps {
  expression: string;
  isResult?: boolean;
  block?: boolean;
  inline?: boolean;
  className?: string;
}

// Helper to convert calculator syntax to LaTeX
export const asciiToLatex = (input: string): string => {
  if (!input) return '';
  let latex = input;

  // 0. Spanish function names → LaTeX equivalents (BEFORE generic function handling)
  latex = latex.replace(/\blimite\b/g, '\\lim');
  latex = latex.replace(/\bderivvar\b/g, '\\frac{d}{dx}');
  latex = latex.replace(/\bsen\b/g, '\\operatorname{sen}');
  latex = latex.replace(/\barcsen\b/g, '\\operatorname{arcsen}');
  latex = latex.replace(/\bsenh\b/g, '\\sinh');
  latex = latex.replace(/\braiz\b/g, '\\sqrt');
  latex = latex.replace(/\braizcub\b/g, '\\sqrt[3]');
  latex = latex.replace(/\bpiso\b/g, '\\lfloor');
  latex = latex.replace(/\btecho\b/g, '\\lceil');
  latex = latex.replace(/\bmaximo\b/g, '\\max');
  latex = latex.replace(/\bminimo\b/g, '\\min');
  latex = latex.replace(/\bsigno\b/g, '\\operatorname{sgn}');
  latex = latex.replace(/\bmod\b/g, '\\bmod');
  latex = latex.replace(/\binversa\b/g, '\\operatorname{inv}');
  latex = latex.replace(/\btranspuesta\b/g, '\\operatorname{transpose}');
  latex = latex.replace(/\bidentidad\b/g, '\\operatorname{eye}');
  latex = latex.replace(/\bceros\b/g, '\\operatorname{zeros}');
  latex = latex.replace(/\bunos\b/g, '\\operatorname{ones}');
  latex = latex.replace(/\bmedia\b/g, '\\operatorname{Mean}');
  latex = latex.replace(/\bmediana\b/g, '\\operatorname{Median}');
  latex = latex.replace(/\bvarianza\b/g, '\\operatorname{Variance}');
  latex = latex.replace(/\bdesviacion\b/g, '\\operatorname{Std}');
  latex = latex.replace(/\bcovarianza\b/g, '\\operatorname{Cov}');
  latex = latex.replace(/\bcorrelacion\b/g, '\\operatorname{Corr}');
  latex = latex.replace(/\bregresion\b/g, '\\operatorname{LinReg}');
  latex = latex.replace(/\bnormalpdf\b/g, '\\mathcal{N}');
  latex = latex.replace(/\bbinomialpmf\b/g, '\\operatorname{Binom}');
  latex = latex.replace(/\bresolver\b/g, '\\operatorname{Solve}');
  latex = latex.replace(/\bEq\b/g, '\\operatorname{Eq}');

  // 1. Basic Symbols
  latex = latex.replace(/\bpi\b/g, '\\pi');
  latex = latex.replace(/\binf\b/g, '\\infty');
  latex = latex.replace(/\btheta\b/g, '\\theta');
  latex = latex.replace(/\*/g, ' \\cdot ');

  // 2. Functions (prepend backslash)
  latex = latex.replace(/(?<!\\)\b(sin|cos|tan|csc|sec|cot|sinh|cosh|tanh|ln|log|det|lim|exp|arcsin|arccos|arctan|max|min|mod)(?=\s*\()/g, '\\$1');

  // 3. Roots: sqrt(x)
  latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');

  // 4. Powers: ^
  latex = latex.replace(/e\^/g, 'e^');

  return latex;
};

const MathDisplay: React.FC<MathDisplayProps> = ({ expression, isResult = false, block = false, inline = false, className = '' }) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        // Convert ASCII math to LaTeX if it doesn't look like LaTeX (starts with \)
        // This heuristic allows us to pass raw LaTeX if needed
        const isRawLatex = expression.trim().startsWith('\\') || expression.includes('{');
        const textToRender = isRawLatex ? expression : asciiToLatex(expression);

        katex.render(textToRender, containerRef.current, {
          throwOnError: false,
          displayMode: block,
          macros: {
            "\\e": "\\mathrm{e}",
            "\\i": "\\mathrm{i}"
          }
        });
      } catch (err) {
        console.error("KaTeX Error:", err);
        containerRef.current.innerText = expression;
      }
    }
  }, [expression, block]);

  const Tag = inline ? 'span' : 'div';

  return (
    <Tag 
      ref={containerRef as any} 
      className={`
        ${isResult ? 'text-aurora-primary text-xl font-bold' : 'text-aurora-text/90 text-lg'} 
        ${inline ? '' : 'overflow-x-auto overflow-y-hidden'}
        ${className}
      `} 
    />
  );
};

export default MathDisplay;