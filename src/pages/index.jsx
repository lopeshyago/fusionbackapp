import Layout from "./Layout.jsx";

import Index from "./SelectRole";

import Schedule from "./Schedule";

import Notices from "./Notices";

import StudentSchedule from "./StudentSchedule";

import StudentCheckin from "./StudentCheckin";

import InstructorStudents from "./InstructorStudents";

import StudentDetail from "./StudentDetail";

import AdminCondominiums from "./AdminCondominiums";

import AdminTeam from "./AdminTeam";

import AdminReports from "./AdminReports";

import StudentWorkouts from "./StudentWorkouts";

import StudentProfile from "./StudentProfile";

import StudentEvolution from "./StudentEvolution";

import InstructorAssessments from "./InstructorAssessments";

import AdminUsers from "./AdminUsers";
import AdminLogin from "./AdminLogin";
import InstructorLogin from "./InstructorLogin";
import StudentLogin from "./StudentLogin";
import AdminDashboard from "./AdminDashboard";
import StudentDashboard from "./StudentDashboard";
import InstructorDashboard from "./InstructorDashboard";

import InstructorWorkouts from "./InstructorWorkouts";

import InstructorAssignWorkout from "./InstructorAssignWorkout";

import InstructorAttendance from "./InstructorAttendance";

import AdminSchedule from "./AdminSchedule";

import InstructorRegistration from "./InstructorRegistration";

import InstructorProfile from "./InstructorProfile";

import Parq from "./Parq";

import MedicalCertificate from "./MedicalCertificate";

import Timeline from "./Timeline";

import SavedPosts from "./SavedPosts";

import InstructorMaintenance from "./InstructorMaintenance";

import AdminMaintenance from "./AdminMaintenance";

import AdminStudentDetail from "./AdminStudentDetail";

import AdminStudentWorkouts from "./AdminStudentWorkouts";

import AdminStudentAssessments from "./AdminStudentAssessments";

import ChatList from "./ChatList";

import ChatRoom from "./ChatRoom";

import StudentSetup from "./StudentSetup";

import Debug from "./Debug";

import GrantAdminAccess from "./GrantAdminAccess";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import SelectRole from "./SelectRole";

const PAGES = {
    
    Index: SelectRole,
    
    Schedule: Schedule,
    
    Notices: Notices,
    
    StudentSchedule: StudentSchedule,
    
    StudentCheckin: StudentCheckin,
    
    InstructorStudents: InstructorStudents,
    
    StudentDetail: StudentDetail,
    
    AdminCondominiums: AdminCondominiums,
    
    AdminTeam: AdminTeam,
    
    AdminReports: AdminReports,
    
    StudentWorkouts: StudentWorkouts,
    
    StudentProfile: StudentProfile,
    
    StudentEvolution: StudentEvolution,
    
    InstructorAssessments: InstructorAssessments,
    
    AdminUsers: AdminUsers,

    AdminLogin: AdminLogin,

    InstructorLogin: InstructorLogin,

    StudentLogin: StudentLogin,

    AdminDashboard: AdminDashboard,

    StudentDashboard: StudentDashboard,

    InstructorDashboard: InstructorDashboard,

    InstructorWorkouts: InstructorWorkouts,
    
    InstructorAssignWorkout: InstructorAssignWorkout,
    
    InstructorAttendance: InstructorAttendance,
    
    AdminSchedule: AdminSchedule,
    
    InstructorRegistration: InstructorRegistration,
    
    InstructorProfile: InstructorProfile,
    
    Parq: Parq,
    
    MedicalCertificate: MedicalCertificate,
    
    Timeline: Timeline,
    
    SavedPosts: SavedPosts,
    
    InstructorMaintenance: InstructorMaintenance,
    
    AdminMaintenance: AdminMaintenance,
    
    AdminStudentDetail: AdminStudentDetail,
    
    AdminStudentWorkouts: AdminStudentWorkouts,
    
    AdminStudentAssessments: AdminStudentAssessments,
    
    ChatList: ChatList,
    
    ChatRoom: ChatRoom,
    
    StudentSetup: StudentSetup,
    
    Debug: Debug,
    
    GrantAdminAccess: GrantAdminAccess,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<SelectRole />} />
                
                
                <Route path="/Index" element={<SelectRole />} />
                
                <Route path="/Schedule" element={<Schedule />} />
                
                <Route path="/Notices" element={<Notices />} />
                
                <Route path="/StudentSchedule" element={<StudentSchedule />} />
                
                <Route path="/StudentCheckin" element={<StudentCheckin />} />
                
                <Route path="/InstructorStudents" element={<InstructorStudents />} />
                
                <Route path="/StudentDetail" element={<StudentDetail />} />
                
                <Route path="/AdminCondominiums" element={<AdminCondominiums />} />
                
                <Route path="/AdminTeam" element={<AdminTeam />} />
                
                <Route path="/AdminReports" element={<AdminReports />} />
                
                <Route path="/StudentWorkouts" element={<StudentWorkouts />} />
                
                <Route path="/StudentProfile" element={<StudentProfile />} />
                
                <Route path="/StudentEvolution" element={<StudentEvolution />} />
                
                <Route path="/InstructorAssessments" element={<InstructorAssessments />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />

                <Route path="/AdminLogin" element={<AdminLogin />} />

                <Route path="/InstructorLogin" element={<InstructorLogin />} />

                <Route path="/StudentLogin" element={<StudentLogin />} />

                <Route path="/AdminDashboard" element={<AdminDashboard />} />

                <Route path="/StudentDashboard" element={<StudentDashboard />} />

                <Route path="/InstructorDashboard" element={<InstructorDashboard />} />

                <Route path="/InstructorWorkouts" element={<InstructorWorkouts />} />
                
                <Route path="/InstructorAssignWorkout" element={<InstructorAssignWorkout />} />
                
                <Route path="/InstructorAttendance" element={<InstructorAttendance />} />
                
                <Route path="/AdminSchedule" element={<AdminSchedule />} />
                
                <Route path="/InstructorRegistration" element={<InstructorRegistration />} />
                
                <Route path="/InstructorProfile" element={<InstructorProfile />} />
                
                <Route path="/Parq" element={<Parq />} />
                
                <Route path="/MedicalCertificate" element={<MedicalCertificate />} />
                
                <Route path="/Timeline" element={<Timeline />} />
                
                <Route path="/SavedPosts" element={<SavedPosts />} />
                
                <Route path="/InstructorMaintenance" element={<InstructorMaintenance />} />
                
                <Route path="/AdminMaintenance" element={<AdminMaintenance />} />
                
                <Route path="/AdminStudentDetail" element={<AdminStudentDetail />} />
                
                <Route path="/AdminStudentWorkouts" element={<AdminStudentWorkouts />} />
                
                <Route path="/AdminStudentAssessments" element={<AdminStudentAssessments />} />
                
                <Route path="/ChatList" element={<ChatList />} />
                
                <Route path="/ChatRoom" element={<ChatRoom />} />
                
                <Route path="/StudentSetup" element={<StudentSetup />} />
                
                <Route path="/Debug" element={<Debug />} />
                
                <Route path="/GrantAdminAccess" element={<GrantAdminAccess />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}