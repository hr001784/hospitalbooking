"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailRoutes = void 0;
const express_1 = require("express");
const EmailController_1 = require("../controllers/EmailController");
const createEmailRoutes = (emailController) => {
    const router = (0, express_1.Router)();
    // Get all emails with optional filtering
    router.get('/', emailController.getEmails.bind(emailController));
    // Search emails
    router.get('/search', emailController.searchEmails.bind(emailController));
    // Get email by ID
    router.get('/:id', emailController.getEmailById.bind(emailController));
    // Suggest reply for an email
    router.post('/:id/suggest-reply', emailController.suggestReply.bind(emailController));
    return router;
};
exports.createEmailRoutes = createEmailRoutes;
//# sourceMappingURL=emailRoutes.js.map