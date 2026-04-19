export interface Customer {
  id: string;
  phone: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  phone: string;
  name: string;
}
