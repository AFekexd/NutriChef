import ToastBasic from "../components/ui/basic-toast";
import ToastTypes from "../components/ui/demo";

export function ToastDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Toast Components Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Demonstration of Ark UI Toast components integrated into the NutriChef app
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Basic Toast
            </h2>
            <ToastBasic />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Toast Types (Success, Error, Warning, Info)
            </h2>
            <ToastTypes />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToastDemoPage;
