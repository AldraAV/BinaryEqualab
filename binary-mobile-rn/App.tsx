import { CalculatorProvider } from './src/contexts/CalculatorContext';
import CalculatorScreen from './src/screens/CalculatorScreen';

export default function App() {
  return (
    <CalculatorProvider>
      <CalculatorScreen />
    </CalculatorProvider>
  );
}
