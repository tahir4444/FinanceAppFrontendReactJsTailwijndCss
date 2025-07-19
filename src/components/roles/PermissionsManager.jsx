import React, { useState, useEffect } from 'react';
import axiosInstance from '../../services/axios';

const PermissionsManager = ({ permissions = [], onChange }) => {
  const [availablePermissions, setAvailablePermissions] = useState({
    resources: [],
    actions: [],
  });

  useEffect(() => {
    fetchAvailablePermissions();
  }, []);

  const fetchAvailablePermissions = async () => {
    try {
      const response = await axiosInstance.get('/roles/permissions');
      setAvailablePermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handlePermissionChange = (resource, action, checked) => {
    const newPermissions = Array.isArray(permissions) ? [...permissions] : [];
    const resourceIndex = newPermissions.findIndex(
      (p) => p.resource === resource
    );

    if (checked) {
      if (resourceIndex === -1) {
        newPermissions.push({
          resource,
          actions: [action],
        });
      } else if (!newPermissions[resourceIndex].actions.includes(action)) {
        newPermissions[resourceIndex].actions.push(action);
      }
    } else {
      if (resourceIndex !== -1) {
        newPermissions[resourceIndex].actions = newPermissions[
          resourceIndex
        ].actions.filter((a) => a !== action);
        if (newPermissions[resourceIndex].actions.length === 0) {
          newPermissions.splice(resourceIndex, 1);
        }
      }
    }

    onChange(newPermissions);
  };

  const isActionChecked = (resource, action) => {
    if (!Array.isArray(permissions)) return false;
    const resourcePermission = permissions.find((p) => p.resource === resource);
    return resourcePermission?.actions?.includes(action) || false;
  };

  return (
    <div className="permissions-manager">
      <h6 className="text-sm font-medium text-gray-700 mb-3">Permissions</h6>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
              </th>
              {availablePermissions.actions.map((action) => (
                <th
                  key={action}
                  className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {availablePermissions.resources.map((resource) => (
              <tr key={resource} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </td>
                {availablePermissions.actions.map((action) => (
                  <td
                    key={action}
                    className="px-3 py-2 whitespace-nowrap text-center"
                  >
                    <div className="flex justify-center">
                      <input
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        type="checkbox"
                        id={`${resource}-${action}`}
                        checked={isActionChecked(resource, action)}
                        onChange={(e) =>
                          handlePermissionChange(
                            resource,
                            action,
                            e.target.checked
                          )
                        }
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionsManager;
