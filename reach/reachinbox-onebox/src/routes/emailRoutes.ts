import { Router } from 'express';
import { EmailController } from '../controllers/EmailController';

export const createEmailRoutes = (emailController: EmailController) => {
  const router = Router();

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