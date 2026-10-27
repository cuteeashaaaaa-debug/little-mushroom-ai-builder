import { HashRouter,Route,Routes } from 'react-router-dom';
import { Shell } from '../components/Shell';
import { CheckinPage } from '../pages/CheckinPage';
import { CoursesPage } from '../pages/CoursesPage';
import { HomePage } from '../pages/HomePage';
import { UnitPage } from '../pages/UnitPage';
import { useAcademy } from './useAcademy';

export default function App(){const academy=useAcademy();return <HashRouter><Shell academy={academy}><Routes><Route path="/" element={<HomePage a={academy}/>}/><Route path="/courses" element={<CoursesPage a={academy}/>}/><Route path="/courses/:id" element={<UnitPage a={academy}/>}/><Route path="/checkin" element={<CheckinPage a={academy}/>}/></Routes></Shell></HashRouter>}
