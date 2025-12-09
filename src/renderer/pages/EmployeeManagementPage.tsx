import React, { useState, useEffect } from 'react';
import { Employee } from '../../models/Employee';
import { Button, Input, Table, Modal, useToast, RubyText } from '../components';
import { validateEmail, validateRequired, combineValidations } from '../../utils/validation';
import { useAppText } from '../utils/textResource';

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
  const { getText } = useAppText();

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
      showError(error.message || getText('errorLoadEmployees'));
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
      showError(validation.error || getText('errorValidation'));
      return;
    }

    try {
      setLoading(true);
      await ipcRenderer.invoke('employees:add', formData.id, formData.name, formData.email);
      showSuccess(getText('successAddEmployee'));
      setIsAddModalOpen(false);
      resetForm();
      await loadEmployees();
    } catch (error: any) {
      showError(error.message || getText('errorAddEmployee'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) {
      showError(getText('errorNotFound'));
      return;
    }

    // バリデーション
    const nameValidation = validateRequired(formData.name, '名前');
    const emailValidation = validateEmail(formData.email);

    const validation = combineValidations(nameValidation, emailValidation);

    if (!validation.isValid) {
      showError(validation.error || getText('errorValidation'));
      return;
    }

    try {
      setLoading(true);
      await ipcRenderer.invoke('employees:update', selectedEmployee.id, {
        name: formData.name,
        email: formData.email,
      });
      showSuccess(getText('successUpdateEmployee'));
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      resetForm();
      await loadEmployees();
    } catch (error: any) {
      showError(error.message || getText('errorUpdateEmployee'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      await ipcRenderer.invoke('employees:delete', selectedEmployee.id);
      showSuccess(getText('successDeleteEmployee'));
      setIsDeleteModalOpen(false);
      setSelectedEmployee(null);
      await loadEmployees();
    } catch (error: any) {
      showError(error.message || getText('errorDeleteEmployee'));
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
      showSuccess(getText('successBarcode'));
    } catch (error: any) {
      showError(error.message || getText('errorBarcode'));
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
      header: getText('colEmployeeId'),
      accessor: 'id' as keyof EmployeeWithLoanCount,
    },
    {
      header: getText('colName'),
      accessor: 'name' as keyof EmployeeWithLoanCount,
    },
    {
      header: getText('colEmail'),
      accessor: 'email' as keyof EmployeeWithLoanCount,
    },
    {
      header: getText('colLoaned'),
      accessor: ((employee: EmployeeWithLoanCount) => (
        <span className="font-semibold">
          {employee.activeLoanCount || 0} 冊
        </span>
      )) as any,
    },
    {
      header: getText('colActions'),
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
            {getText('btnBarcode')}
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e?.stopPropagation();
              openEditModal(employee);
            }}
            className="text-xs px-3 py-1"
          >
            {getText('actionEdit')}
          </Button>
          <Button
            variant="danger"
            onClick={(e) => {
              e?.stopPropagation();
              openDeleteModal(employee);
            }}
            className="text-xs px-3 py-1"
          >
            {getText('actionDelete')}
          </Button>
        </div>
      )) as any,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          <RubyText>{getText('employeesTitle')}</RubyText>
        </h2>
        <Button onClick={() => setIsAddModalOpen(true)}>{getText('btnAddEmployee')}</Button>
      </div>

      {/* 社員一覧テーブル */}
      {loading ? (
        <div className="text-center py-8">{getText('loadingEmployees')}</div>
      ) : (
        <Table columns={columns} data={employees} emptyMessage={getText('emptyEmployees')} />
      )}

      {/* 追加モーダル */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title={getText('modalAddEmployee')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              {getText('btnCancel')}
            </Button>
            <Button onClick={handleAddEmployee} disabled={loading}>
              {getText('btnAdd')}
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
        title={getText('modalEditEmployee')}
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
              {getText('btnCancel')}
            </Button>
            <Button onClick={handleEditEmployee} disabled={loading}>
              {getText('btnUpdate')}
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
        title={getText('modalDeleteEmployee')}
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
              {getText('btnCancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteEmployee}
              loading={loading}
              ariaLabel="社員を削除"
            >
              {getText('btnDelete')}
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
                <RubyText>{getText('confirmDelete')}</RubyText>
              </p>
              <p className="text-sm text-gray-700">
                「{selectedEmployee?.name}」（{getText('labelEmployeeId')}: {selectedEmployee?.id}）を削除します。
                <RubyText>{getText('deleteWarning')}</RubyText>
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
        title={getText('modalBarcode')}
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
              {getText('btnCancel')}
            </Button>
          </>
        }
      >
        <div className="text-center space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              <RubyText>{getText('labelEmployeeId')}</RubyText>: {selectedEmployee?.id}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <RubyText>{getText('labelName')}</RubyText>: {selectedEmployee?.name}
            </p>
          </div>
          {barcodeImagePath && (
            <div className="bg-white p-4 border rounded">
              <img
                src={barcodeImagePath}
                alt={getText('modalBarcode')}
                className="mx-auto"
              />
            </div>
          )}
          <p className="text-xs text-gray-500">
            <RubyText>{getText('barcodeDescription')}</RubyText>
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
  const { getText } = useAppText();

  return (
    <div className="space-y-4">
      <Input
        label={getText('labelEmployeeId')}
        value={formData.id}
        onChange={(value) => setFormData({ ...formData, id: value })}
        required
        disabled={isEdit}
        id="employeeId"
        placeholder={getText('placeholderEmployeeId')}
      />
      <Input
        label={getText('labelName')}
        value={formData.name}
        onChange={(value) => setFormData({ ...formData, name: value })}
        required
        id="name"
        placeholder={getText('placeholderName')}
      />
      <Input
        label={getText('labelEmail')}
        type="email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        required
        id="email"
        placeholder={getText('placeholderEmail')}
      />
    </div>
  );
};

export default EmployeeManagementPage;
