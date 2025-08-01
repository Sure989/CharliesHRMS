
// Find the getEmployees function and update it:
export const getEmployees = async (options = {}) => {
  const { includeRelations = true } = options;
  const response = await api.get(`/api/employees?includeRelations=${includeRelations}`);
  return response.data;
};
