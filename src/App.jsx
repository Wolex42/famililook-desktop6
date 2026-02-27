import { BrowserRouter } from 'react-router-dom';
import { ConsentProvider } from './state/ConsentContext';
import { MatchProvider } from './state/MatchContext';
import AppRouter from './AppRouter';

export default function App() {
  return (
    <BrowserRouter>
      <ConsentProvider>
        <MatchProvider>
          <AppRouter />
        </MatchProvider>
      </ConsentProvider>
    </BrowserRouter>
  );
}
