const express = require('express');
const router = express.Router();

//###################################################################

//use authMiddleware untuk semua routes
const authRoutes = require('./authRoutes');//USE

// petugas routes mobile-------------------------------------------
const petugasCustomerRoutes = require('./petugas/customerRoutes');//USE
const petugasPaymentRoutes = require('./petugas/paymentRoutes');//USE
const petugasMeterReadingRoutes = require('./petugas/meterReadingRoutes');//USE
const petugasHistoryRoutes = require('./petugas/historyRoutes');//USE
const petugasDashboardRoutes = require('./petugas/dashboardRoutes');//USE
const petugasCustomerPageRoutes = require('./petugas/customerPageRoutes');//USE
const petugasPermissionRoutes = require('./petugas/permissionRoutes');//USE
const petugasProfileRoutes = require('./petugas/profileRoutes');//USE
const petugasUploadRoutes = require('./petugas/uploadRoutes');//USE UPLOAD IAMAGE
const petugasDocumentRoutes = require('./petugas/documentRoutes');

// admin routes----------------------------------------------------
const adminAreaRoutes = require('./admin/areaRoutes');//USE
const adminOfficerRoutes = require('./admin/officerRoutes');//USE
const adminOfficerAreaRoutes = require('./admin/officerAreaRoutes');//USE
const adminCustomerRoutes = require('./admin/customerRoutes');//USE
const transitionCustomersRoutes = require('./admin/transitionCustomersRoutes');//USE
const dashboardRoutes = require('./admin/dashboardRoutes');//USE
const customerReportRoutes = require('./admin/customerReportRoutes');
const financeRoutes = require('./admin/financeRoutes');
const analystRoutes = require('./admin/analystRoutes');
const adminProfileRoutes = require('./admin/profileRoutes');
const waterUsageRoutes = require('./admin/waterUsageRoutes');
const settingsRoutes = require('./admin/settingsRoutes');
const adminHistoryRoutes = require('./admin/adminHistoryRoutes');

//###################################################################



//###################################################################

//use auth
router.use('/auth', authRoutes);//USE


// use petugas routes mobile-------------------------------------------
router.use('/petugas/customers/my-area', petugasCustomerPageRoutes);//USE
router.use('/petugas/customers', petugasCustomerRoutes);//USE
router.use('/petugas/payments', petugasPaymentRoutes);//USE
router.use('/petugas/meter-readings', petugasMeterReadingRoutes);//USE
router.use('/petugas/history', petugasHistoryRoutes);//USE
router.use('/petugas/dashboard', petugasDashboardRoutes);//USE
router.use('/petugas/permissions', petugasPermissionRoutes);
router.use('/petugas/profile', petugasProfileRoutes);//USE
router.use('/petugas/uploads', petugasUploadRoutes);//USE UPLOAD IAMAGE
router.use('/petugas/documents', petugasDocumentRoutes);//USE DOCUMENTS

// use admin routes----------------------------------------------------
router.use('/admin/areas', adminAreaRoutes);//USE
router.use('/admin/officers', adminOfficerRoutes);//USE
router.use('/admin/officer-areas', adminOfficerAreaRoutes);//USE
router.use('/admin/customers', adminCustomerRoutes);//USE
router.use('/admin/transition-customers', transitionCustomersRoutes);//USE
router.use('/admin/dashboard', dashboardRoutes);
router.use('/admin/customer-reports', customerReportRoutes);
router.use('/admin/finance', financeRoutes);
router.use('/admin/analyst', analystRoutes);
router.use('/admin/profile', adminProfileRoutes);
router.use('/admin/water-usage', waterUsageRoutes);
router.use('/admin/settings', settingsRoutes);
router.use('/admin/history', adminHistoryRoutes);

//###################################################################

module.exports = router;
