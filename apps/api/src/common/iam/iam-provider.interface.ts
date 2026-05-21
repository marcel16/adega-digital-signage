export interface IamProvider {
  authenticate(token: string): Promise<any>;
  authorize(userId: string, resource: string, action: string): Promise<boolean>;
  createUser(data: any): Promise<any>;
  updateUser(id: string, data: any): Promise<any>;
  deleteUser(id: string): Promise<void>;
  listUsers(filters: any): Promise<any[]>;
  assignRole(userId: string, role: string): Promise<void>;
  removeRole(userId: string, role: string): Promise<void>;
}
