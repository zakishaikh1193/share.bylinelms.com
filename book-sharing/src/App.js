import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterUser from './pages/manage-user/RegisterUser';
import AdminDashboard from './pages/Dashboards/adminDashboard';
import UserDashboard from './pages/Dashboards/userDashboard';
import { AuthProvider } from './context/AuthContext';
import Users from "./pages/manage-user/user";
import Books from "./pages/manageDeliverables/books";
import AdminRoute from './components/AdminRoute';
import UserRoute from './components/UserRoute';
import RequestAccess from "./pages/Inputs/RequestAccess";
import ActivityLog from "./pages/Inputs/ActivityLog";
import ClientInputs from "./pages/Inputs/ClientInputs";
import AddBook from './pages/manageDeliverables/AddBook.jsx';
import ManageAccess from './pages/manage-user/ManageAccess.jsx';
import DisplayCover from './pages/explorePage/coverDisplay.jsx';
import DisplayBook from './pages/explorePage/bookDisplay.jsx';
import BookUpload from './pages/Dashboards/Users/BookUpload.jsx';
import CoverUpload from './pages/Dashboards/Users/CoverUpload.jsx';
import IssuedBooks from './pages/Dashboards/Users/issuedBook.jsx';
import ManageDataAdmin from './pages/manageDataPage/ManageDataAdmin.jsx';
import BookListPage from './pages/Dashboards/Users/BooksListPage.jsx';
import FlipbookViewer from './pages/Dashboards/Users/FlipbookViewer.jsx';
import BookDetail from './pages/explorePage/bookDetails.jsx';
import EditBook from './pages/manageDeliverables/EditBook.jsx';
import EditUser from './pages/manage-user/EditUser.jsx';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* User Dashboard layout with nested user pages */}
        <Route path="/user/dashboard" element={
          <UserRoute>
            <UserDashboard />
          </UserRoute>
        }>
          <Route path="upload-cover" element={<CoverUpload />} />
          <Route path="upload-book" element={<BookUpload />} />
          <Route path="issued-books" element={<IssuedBooks />} />
          <Route path="books-list" element={<BookListPage />} />
        </Route>

        {/* Admin Layout Wrapper for all admin pages */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
          <Route path="register" element={<RegisterUser />} />
          <Route path="users" element={<Users />} />
          <Route path="books" element={<Books />} />
          <Route path="add-book" element={<AddBook />} />
          <Route path="explore-covers" element={<DisplayCover />} />
          <Route path="explore-books" element={<DisplayBook />} />
          <Route path="manage-data" element={<ManageDataAdmin />} />
          <Route path="request-access" element={<RequestAccess />} />
          <Route path="activity-log" element={<ActivityLog />} />
          <Route path="client-inputs" element={<ClientInputs />} />
          <Route path="manage-access" element={<ManageAccess />} />
          <Route path="edit-user/:userId" element={<EditUser />} />
          <Route path="edit-book/:bookId" element={<EditBook />} />
     </Route>

        {/* Publicly accessible Book Detail page */}
        <Route path="/books/:id" element={<BookDetail />} /> {/* ✅ Added here */}

        {/* Flipbook Viewer */}
        <Route path="/books/:bookId/flipbook" element={<FlipbookViewer />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
