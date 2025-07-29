import {BrowserRouter,Route,Routes} from 'react-router-dom';
import Booking from './page/Booking';
import Reservation from './page/Reservation';
import Member from './page/Member';
import SaleReport from './page/SaleReport';
import Display from './page/Display';
import './App.css';
import ReprintReceipt from './page/ReprintReceipt';
import Login from './page/auth/Login';
import UserRoute from './Routes/UserRoute';
import AuditRoute from './Routes/AuditRoute';
//For Audit
import AuditBooking from './page/audit/AuditBooking';
import AuditReservation from './page/audit/AuditReservation';
import AuditMember from './page/audit/AuditMember';
import AuditSaleReport from './page/audit/AuditSaleReport';
import AuditDisplay from './page/audit/AuditDisplay';
import AuditReprintReceipt from './page/audit/AuditReprintReceipt';
import AuditUser from './page/audit/AuditUser'; 

function App() {
  return (
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/auditBooking" element={<AuditRoute><AuditBooking /></AuditRoute>} />
        <Route path="/auditMember" element={<AuditRoute><AuditMember /></AuditRoute>} />
        <Route path="/auditReservation" element={<AuditRoute><AuditReservation /></AuditRoute>} />
        <Route path="/auditSaleReport" element={<AuditRoute><AuditSaleReport /></AuditRoute>} />
        <Route path="/auditDisplay" element={<AuditRoute><AuditDisplay /></AuditRoute>} />
        <Route path="/auditReprintReceipt" element={<AuditRoute><AuditReprintReceipt /></AuditRoute>} />
        <Route path="/register" element={<AuditRoute><AuditUser/></AuditRoute>}/>

        <Route path="/booking" element={<UserRoute><Booking /></UserRoute>} />
        <Route path="/reservation" element={<UserRoute><Reservation /></UserRoute>} />
        <Route path="/member" element={<UserRoute><Member /></UserRoute>} />
        <Route path="/saleReport" element={<UserRoute><SaleReport /></UserRoute>} />
        <Route path="/display" element={<UserRoute><Display /></UserRoute>} />
        <Route path="/reprintReceipt" element={<UserRoute><ReprintReceipt /></UserRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
