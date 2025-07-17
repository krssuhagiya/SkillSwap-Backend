const express = require("express");
const userProfileController = require("../controllers/userprofile.controller");
const router = express.Router();
const auth = require("../middleware/auth");

// Basic Profile Routes
router.post('/create',auth, userProfileController.createProfile);
router.get('/user/:userId',auth, userProfileController.getProfileByUserId);
router.get('/profile/:id',auth, userProfileController.getProfileById);
router.put('/user/:userId',auth, userProfileController.updateProfile);
router.delete('/user/:userId',auth, userProfileController.deleteProfile);

// Public Profiles Route
router.get('/public', userProfileController.getPublicProfiles);

// Experience Routes
router.post("/user/:userId/experience", userProfileController.addExperience);
router.put('/user/:userId/experience/:experienceId', userProfileController.updateExperience);
router.delete('/user/:userId/experience/:experienceId', userProfileController.removeExperience);

// Education Routes
router.post('/user/:userId/education', userProfileController.addEducation);
router.put('/user/:userId/education/:educationId', userProfileController.updateEducation);
router.delete('/user/:userId/education/:educationId', userProfileController.removeEducation);


// Time Credits Routes
router.put('/user/:userId/time-credits', userProfileController.updateTimeCredits);

// Profile Visibility Routes
router.put('/user/:userId/toggle-visibility', userProfileController.toggleProfileVisibility);

module.exports = router;

