import React, { useState, useEffect } from 'react';
import { Employee } from '../../models/Employee';
import { Button, Input, Table, Modal, useToast } from '../components';
import { validateEmail, validateRequired, combineValidations } from '../../utils/validation';

const { ipcRenderer } = window.require('electron');

interface EmployeeWithLoanCount extends Employee {
  activeLoanCount?: number;
}

const EmployeeManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithLoanCount[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithLoanCount | null>(null);
  const [barcodeImagePath, setBarcodeImagePath] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { showSuccess, showError } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const allEmployees = await ipcRenderer.invoke('employees:getAll');
      
      // 各社員の貸出冊数を取得
      const employeesWithCount = await Promise.all(
        allEmployees.map(async (employee: Employee) => {
          try {
            const count = await ipcRenderer.invoke('employees:getActiveLoanCount', employee.id);
            return { ...employee, activeLoanCount: count };
          } catch {
            return { ...employee, activeLoanCount: 0 };
          }
        })
      );
      
      setEmployees(employeesWithCount);
    } catch (error: any) {
      showError(error.message || '社員の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    // バリデーション
    const idValidation = validateRequired(formData.id, '社員ID');
    const nameValidation = validateRequired(formData.name, '名前');
    const emailValidation = validateEmail(formData.email);

    const validation = combineValidations(idValidation, nameValidation, emailValidation);

    if (!validation.isValid) {
      showError(validation.error || 'すべての項目を正しく入力してください');
      return;
    }

    try {
      setLoading(true);
      await ipcRenderer.invoke('employees:add', formData.id, formData.name, formData.email);
      showSuccess('社員を追加しました');
      setIsAddModalOpen(false);
      resetForm();
      await loadEmployees();
    } catch (error: any) {
      showError(error.message || '社員の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) {
      showError('社員が選択されていません');
      return;
    }

    // バリデーション
    const nameValidation = validateRequired(formData.name, '名前');
    const emailValidation = validateEmail(formData.email);

    const validation = combineValidations(nameValidation, emailValidation);

    if (!validation.isValid) {
      showError(validation.error || 'すべての項目を正しく入力してください');
      return;
    }

    try {
      setLoading(true);
      await ipcRenderer.invoke('employees:update', selectedEmployee.id, {
        name: formData.name,
        email: formData.email,
      });
      showSuccess('社員情報を更新しました');
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      resetForm();
      await loadEmployees();
    } catch (error: any) {
      showError(error.message || '社員情報の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      await ipcRenderer.invoke('employees:delete', selectedEmployee.id);
      showSuccess('社員を削除しました');
      setIsDeleteModalOpen(false);
      setSelectedEmployee(null);
      await loadEmployees();
    } catch (error: any) {
      showError(error.message || '社員の削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBarcode = async (employee: EmployeeWithLoanCount) => {
    try {
      setLoading(true);
      const imagePath = await ipcRenderer.invoke('employees:generateBarcode', employee.id);
      setBarcodeImagePath(imagePath);
      setSelectedEmployee(employee);
      setIsBarcodeModalOpen(true);
      showSuccess('バーコードを生成しました');
    } catch (error: any) {
      showError(error.message || 'バーコードの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (employee: EmployeeWithLoanCount) => {
    setSelectedEmployee(employee);
    setFormData({
      id: employee.id,
      name: employee.name,
      email: employee.email,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (employee: EmployeeWithLoanCount) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      email: '',
    });
  };

  const columns = [
    {
      header: '社員ID',
      accessor: 'id' as keyof EmployeeWithLoanCount,
    },
    {
      header: '名前',
      accessor: 'name' as keyof EmployeeWithLoanCount,
    },
    {
      header: 'メールアドレス',
      accessor: 'email' as keyof EmployeeWithLoanCount,
    },
    {
      header: '貸出中',
      accessor: ((employee: EmployeeWithLoanCount) => (
        <span className="font-semibold">
          {employee.activeLoanCount || 0} 冊
        </span>
      )) as any,
    },
    {
      header: '操作',
      accessor: ((employee: EmployeeWithLoanCount) => (
        <div className="flex space-x-2">
          <Button
            variant="success"
            onClick={(e) => {
              e?.stopPropagation();
              handleGenerateBarcode(employee);
            }}
            className="text-xs px-3 py-1"
          >
            バーコード
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e?.stopPropagation();
              openEditModal(employee);
            }}
            className="text-xs px-3 py-1"
          >
            編集
          </Button>
          <Button
            variant="danger"
            onClick={(e) => {
              e?.stopPropagation();
              openDeleteModal(employee);
            }}
            className="text-xs px-3 py-1"
          >
            削除
          </Button>
        </div>
      )) as any,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">社員管理</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>社員を追加</Button>
      </div>

      {/* 社員一覧テーブル */}
      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : (
        <Table columns={columns} data={employees} emptyMessage="社員が見つかりません" />
      )}

      {/* 追加モーダル */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="社員を追加"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleAddEmployee} disabled={loading}>
              追加
            </Button>
          </>
        }
      >
        <EmployeeForm formData={formData} setFormData={setFormData} isEdit={false} />
      </Modal>

      {/* 編集モーダル */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
          resetForm();
        }}
        title="社員情報を編集"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
                resetForm();
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleEditEmployee} disabled={loading}>
              更新
            </Button>
          </>
        }
      >
        <EmployeeForm formData={formData} setFormData={setFormData} isEdit={true} />
      </Modal>

      {/* 削除確認モーダル */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedEmployee(null);
        }}
        title="社員を削除"
        size="sm"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedEmployee(null);
              }}
              ariaLabel="キャンセル"
            >
              キャンセル
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteEmployee}
              loading={loading}
              ariaLabel="社員を削除"
            >
              削除
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-error-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-base text-gray-900 font-medium mb-2">
                本当に削除しますか？
              </p>
              <p className="text-sm text-gray-700">
                「{selectedEmployee?.name}」（社員ID: {selectedEmployee?.id}）を削除します。
                この操作は取り消せません。
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* バーコードプレビューモーダル */}
      <Modal
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          setSelectedEmployee(null);
          setBarcodeImagePath('');
        }}
        title="会員バーコード"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsBarcodeModalOpen(false);
                setSelectedEmployee(null);
                setBarcodeImagePath('');
              }}
            >
              閉じる
            </Button>
          </>
        }
      >
        <div className="text-center space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">社員ID: {selectedEmployee?.id}</p>
            <p className="text-sm text-gray-600 mb-4">名前: {selectedEmployee?.name}</p>
          </div>
          {barcodeImagePath && (
            <div className="bg-white p-4 border rounded">
              <img
                src={barcodeImagePath}
                alt="会員バーコード"
                className="mx-auto"
              />
            </div>
          )}
          <p className="text-xs text-gray-500">
            社員ID {selectedEmployee?.id} のバーコード画像
          </p>
        </div>
      </Modal>
    </div>
  );
};

// 社員フォームコンポーネント
interface EmployeeFormProps {
  formData: {
    id: string;
    name: string;
    email: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      id: string;
      name: string;
      email: string;
    }>
  >;
  isEdit: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ formData, setFormData, isEdit }) => {
  return (
    <div className="space-y-4">
      <Input
        label="社員ID"
        value={formData.id}
        onChange={(value) => setFormData({ ...formData, id: value })}
        required
        disabled={isEdit}
        id="employeeId"
        placeholder="例: EMP001"
      />
      <Input
        label="名前"
        value={formData.name}
        onChange={(value) => setFormData({ ...formData, name: value })}
        required
        id="name"
        placeholder="例: 山田太郎"
      />
      <Input
        label="メールアドレス"
        type="email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        required
        id="email"
        placeholder="例: yamada@company.com"
      />
    </div>
  );
};

export default EmployeeManagementPage;
