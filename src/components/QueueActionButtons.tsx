import React, { useState } from 'react';
import { queueAdminService, QUEUE_ACTIONS, QUEUE_STATUS } from '../services/queueService';

interface QueueActionButtonsProps {
  ticketId: number;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export const QueueActionButtons: React.FC<QueueActionButtonsProps> = ({
  ticketId,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState<number | null>(null);

  const handleAction = async (actionType: number, actionName: string) => {
    setLoading(actionType);
    
    try {
      let result;
      
      switch (actionType) {
        case QUEUE_ACTIONS.PICKUP:
          result = await queueAdminService.pickupTicket(ticketId);
          break;
        case QUEUE_ACTIONS.RETRIEVE:
          result = await queueAdminService.retrieveTicket(ticketId);
          break;
        case QUEUE_ACTIONS.PRIORITY:
          result = await queueAdminService.priorityTicket(ticketId);
          break;
        default:
          throw new Error('Invalid action type');
      }

      if (result.isChangeSuccess) {
        onSuccess?.(result);
      } else {
        onError?.(`${actionName} failed`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `${actionName} failed`;
      onError?.(errorMessage);
      console.error(`${actionName} error:`, error);
    } finally {
      setLoading(null);
    }
  };

  const handleCustomAction = async (status: number, action: number) => {
    setLoading(action);
    
    try {
      const result = await queueAdminService.changeTicketStatus(ticketId, status, action);
      
      if (result.isChangeSuccess) {
        onSuccess?.(result);
      } else {
        onError?.('Custom action failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Custom action failed';
      onError?.(errorMessage);
      console.error('Custom action error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex space-x-2">
      {/* Pickup Button */}
      <button
        onClick={() => handleAction(QUEUE_ACTIONS.PICKUP, 'Pickup')}
        disabled={loading !== null}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
      >
        {loading === QUEUE_ACTIONS.PICKUP && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        Pickup
      </button>

      {/* Retrieve Button */}
      <button
        onClick={() => handleAction(QUEUE_ACTIONS.RETRIEVE, 'Retrieve')}
        disabled={loading !== null}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
      >
        {loading === QUEUE_ACTIONS.RETRIEVE && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        Retrieve
      </button>

      {/* Priority Button */}
      <button
        onClick={() => handleAction(QUEUE_ACTIONS.PRIORITY, 'Priority')}
        disabled={loading !== null}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
      >
        {loading === QUEUE_ACTIONS.PRIORITY && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        Priority
      </button>

      {/* Custom Action Example */}
      <button
        onClick={() => handleCustomAction(QUEUE_STATUS.Completed, QUEUE_ACTIONS.PICKUP)}
        disabled={loading !== null}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
      >
        Complete
      </button>
    </div>
  );
};

// Example usage component
export const QueueActionExample: React.FC = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<number>(123);
  const [message, setMessage] = useState<string>('');

  const handleSuccess = (result: any) => {
    setMessage(`Action successful: ${result.statusName} for ticket ${result.ticketNumber}`);
  };

  const handleError = (error: string) => {
    setMessage(`Error: ${error}`);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Queue Action Example</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ticket ID:
        </label>
        <input
          type="number"
          value={selectedTicketId}
          onChange={(e) => setSelectedTicketId(Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2 w-32"
        />
      </div>

      <div className="mb-4">
        <QueueActionButtons
          ticketId={selectedTicketId}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>

      {message && (
        <div className={`p-4 rounded ${
          message.startsWith('Error') 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">Action Types:</h3>
        <ul className="text-sm space-y-1">
          <li><strong>Pickup (1):</strong> Normal pickup of a ticket</li>
          <li><strong>Retrieve (2):</strong> Retrieve a ticket (maybe from storage)</li>
          <li><strong>Priority (3):</strong> Priority handling of a ticket</li>
        </ul>

        <h3 className="text-lg font-semibold mb-2 mt-4">Status Types:</h3>
        <ul className="text-sm space-y-1">
          <li><strong>Waiting (1):</strong> Customer is waiting</li>
          <li><strong>In Service (2):</strong> Currently being served</li>
          <li><strong>Completed (3):</strong> Service completed</li>
          <li><strong>Cancelled (4):</strong> Ticket cancelled</li>
        </ul>
      </div>
    </div>
  );
};

export default QueueActionButtons;
