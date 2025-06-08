import React from "react";

export interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export default function Expenses({
  uploadedFiles,
}: {
  uploadedFiles: UploadedFile[];
}) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-6 backdrop-blur-md animate-fade-in-up">
      <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-4">
        Submitted Expenses
      </h2>
      <div className="space-y-4">
        {uploadedFiles.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No expenses submitted yet.
          </p>
        ) : (
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={`/uploads/${file.filename}`}
                      alt={file.originalName}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">
                        PDF
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
