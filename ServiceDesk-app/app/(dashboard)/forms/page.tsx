/**
 * /forms redirect — canonical entry point for the Forms Platform.
 * Redirects to /smart-forms which is the Form Builder page.
 */
import { redirect } from 'next/navigation';

export default function FormsPage() {
  redirect('/smart-forms');
}
