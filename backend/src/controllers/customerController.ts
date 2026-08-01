import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService.js';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const customers = await CustomerService.getAll();
    return res.status(200).json({ success: true, data: customers });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const customer = await CustomerService.getById(id);
    return res.status(200).json({ success: true, data: customer });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await CustomerService.create(req.body);
    return res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const customer = await CustomerService.update(id, req.body);
    return res.status(200).json({ success: true, data: customer });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await CustomerService.delete(id);
    return res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
