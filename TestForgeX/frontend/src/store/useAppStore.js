import { useContext } from 'react';
import { AppContext } from './AppContext.jsx';

export const useAppStore = () => useContext(AppContext);
