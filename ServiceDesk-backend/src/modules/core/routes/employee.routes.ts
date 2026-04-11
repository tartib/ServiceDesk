import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import * as employeeCtrl from '../controllers/employee.controller';

const router = Router();

router.use(authenticate);

router.get('/', employeeCtrl.getAllEmployees);
router.get('/:id', employeeCtrl.getEmployeeById);
router.post('/', employeeCtrl.createEmployee);
router.put('/:id', employeeCtrl.updateEmployee);
router.delete('/:id', employeeCtrl.deleteEmployee);

export default router;
