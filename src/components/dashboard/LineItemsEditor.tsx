'use client';

import { Button, Flex, Form, Input, InputNumber, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Controller,
  type Control,
  type FieldArray,
  type FieldArrayPath,
  type FieldValues,
  type Path,
  useFieldArray,
} from 'react-hook-form';

type LineItemsEditorProps<TFormValues extends FieldValues> = {
  control: Control<TFormValues>;
  name: FieldArrayPath<TFormValues>;
};

export function LineItemsEditor<TFormValues extends FieldValues>({
  control,
  name,
}: LineItemsEditorProps<TFormValues>) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const emptyItem = {
    description: '',
    quantity: 1,
    unit: 'nos',
    rate: 0,
  } as FieldArray<TFormValues, FieldArrayPath<TFormValues>>;

  return (
    <div>
      <Flex justify="space-between" align="center" className="mb-3">
        <Typography.Text strong>Line Items</Typography.Text>
        <Button
          icon={<PlusOutlined />}
          onClick={() => append(emptyItem)}
        >
          Add Item
        </Button>
      </Flex>

      <Space direction="vertical" className="w-full" size={12}>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-[10px] border border-white/10 bg-white/[0.025] p-3"
          >
            <Flex gap={8} align="flex-start" wrap="wrap">
              <Controller
                control={control}
                name={`${name}.${index}.description` as Path<TFormValues>}
                render={({ field: inputField, fieldState }) => (
                  <Form.Item
                    label="Description"
                    validateStatus={fieldState.error ? 'error' : undefined}
                    help={fieldState.error?.message}
                    className="mb-2 min-w-60 flex-1"
                  >
                    <Input {...inputField} placeholder="Civil works, material, labour..." />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name={`${name}.${index}.quantity` as Path<TFormValues>}
                render={({ field: inputField, fieldState }) => (
                  <Form.Item
                    label="Qty"
                    validateStatus={fieldState.error ? 'error' : undefined}
                    help={fieldState.error?.message}
                    className="mb-2 w-[120px]"
                  >
                    <InputNumber
                      min={0}
                      precision={3}
                      className="w-full"
                      value={inputField.value}
                      onChange={inputField.onChange}
                    />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name={`${name}.${index}.unit` as Path<TFormValues>}
                render={({ field: inputField, fieldState }) => (
                  <Form.Item
                    label="Unit"
                    validateStatus={fieldState.error ? 'error' : undefined}
                    help={fieldState.error?.message}
                    className="mb-2 w-[110px]"
                  >
                    <Input {...inputField} placeholder="nos" />
                  </Form.Item>
                )}
              />
              <Controller
                control={control}
                name={`${name}.${index}.rate` as Path<TFormValues>}
                render={({ field: inputField, fieldState }) => (
                  <Form.Item
                    label="Rate"
                    validateStatus={fieldState.error ? 'error' : undefined}
                    help={fieldState.error?.message}
                    className="mb-2 w-[150px]"
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      prefix="₹"
                      className="w-full"
                      value={inputField.value}
                      onChange={inputField.onChange}
                    />
                  </Form.Item>
                )}
              />
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                aria-label="Remove item"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="mt-[30px]"
              />
            </Flex>
          </div>
        ))}
      </Space>
    </div>
  );
}
