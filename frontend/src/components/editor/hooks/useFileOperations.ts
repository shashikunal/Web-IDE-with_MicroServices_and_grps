import { useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    useSaveFileMutation,
    useCreateFileMutation,
    useCreateDirectoryMutation,
    useDeleteFileMutation,
    useMoveFileMutation,
    useCopyFileMutation
} from '../../../store/api/apiSlice';
import type { FileItem } from '../../../store/api/apiSlice';

interface UseFileOperationsProps {
    userId: string;
    workspaceId: string;
    onRefresh: () => void;
    onItemDelete: (path: string) => void;
}

export function useFileOperations({
    userId,
    workspaceId,
    onRefresh,
    onItemDelete
}: UseFileOperationsProps) {
    const [saveFile] = useSaveFileMutation();
    const [createFileMutation] = useCreateFileMutation();
    const [createDirectory] = useCreateDirectoryMutation();
    const [deleteFile] = useDeleteFileMutation();
    const [moveFile] = useMoveFileMutation();
    const [copyFile] = useCopyFileMutation();

    const handleCreateFile = useCallback(async (path: string, content: string = '') => {
        try {
            await createFileMutation({ userId, workspaceId, path, content }).unwrap();
            toast.success(`Created: ${path.split('/').pop()}`);
            return true;
        } catch {
            toast.error('Failed to create file');
            return false;
        }
    }, [userId, workspaceId, createFileMutation]);

    const handleCreateDirectory = useCallback(async (path: string) => {
        try {
            await createDirectory({ userId, workspaceId, path }).unwrap();
            toast.success(`Created folder: ${path.split('/').pop()}`);
            return true;
        } catch {
            toast.error('Failed to create folder');
            return false;
        }
    }, [userId, workspaceId, createDirectory]);

    const handleSaveFile = useCallback(async (path: string, content: string) => {
        try {
            await saveFile({ userId, workspaceId, path, content }).unwrap();
            toast.success('File saved');
            return true;
        } catch {
            toast.error('Failed to save file');
            return false;
        }
    }, [userId, workspaceId, saveFile]);

    const handleDeleteFile = useCallback(async (path: string) => {
        try {
            await deleteFile({ userId, workspaceId, path }).unwrap();
            toast.success('Deleted successfully');
            onItemDelete(path);
            onRefresh();
            return true;
        } catch {
            toast.error('Failed to delete');
            return false;
        }
    }, [userId, workspaceId, deleteFile, onItemDelete, onRefresh]);

    const handleMoveFile = useCallback(async (sourcePath: string, destinationPath: string) => {
        try {
            await moveFile({ userId, workspaceId, sourcePath, destinationPath }).unwrap();
            toast.success('Moved successfully');
            onRefresh();
            return true;
        } catch (err: any) {
            toast.error(err?.data?.error || 'Failed to move file');
            return false;
        }
    }, [userId, workspaceId, moveFile, onRefresh]);

    const handleCopyFile = useCallback(async (sourcePath: string, destinationPath: string) => {
        try {
            await copyFile({ userId, workspaceId, sourcePath, destinationPath }).unwrap();
            toast.success('Copied successfully');
            onRefresh();
            return true;
        } catch {
            toast.error('Failed to copy');
            return false;
        }
    }, [userId, workspaceId, copyFile, onRefresh]);

    return {
        handleCreateFile,
        handleCreateDirectory,
        handleSaveFile,
        handleDeleteFile,
        handleMoveFile,
        handleCopyFile
    };
}
