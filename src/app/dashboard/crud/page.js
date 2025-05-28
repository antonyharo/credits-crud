"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, Check, Pencil, Plus } from "lucide-react";

export default function Home() {
    const [tasks, setTasks] = useState([]);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm();

    const loadTasks = async () => {
        try {
            const response = await fetch("/api/read");

            const data = await response.json();
            response.ok
                ? setTasks(data)
                : setErrorMessage(`Error: ${data.error}`);
        } catch (error) {
            setErrorMessage("Error while fetching tasks.");
        }
    };

    // Função para adicionar ou editar uma task
    const onSubmit = async (data) => {
        if (errors.name || errors.description) return;

        const task = {
            ...(data.id && { id: data.id }),
            title: data.title,
            description: data.description,
        };

        if (editingTask) {
            // Editando uma tarefa existente
            try {
                const response = await fetch("/api/update", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(task),
                });

                const data = await response.json();

                if (response.ok) {
                    setSuccessMessage("Task updated successfully!");

                    setTasks((prevTasks) =>
                        prevTasks.map((t) => (t.id === data.id ? data : t))
                    );
                } else {
                    setErrorMessage(`Error: ${data.error}`);
                }
            } catch (error) {
                setErrorMessage(`Error while editing task.`);
            }
        } else {
            try {
                const response = await fetch("/api/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(task),
                });

                const data = await response.json();

                if (response.ok) {
                    setSuccessMessage("Task added successfully!");
                } else {
                    setErrorMessage(`Error: ${data.error}`);
                }

                setTasks([...tasks, data]);
            } catch (error) {
                setErrorMessage("Error while creating task.");
            }
        }

        reset();
        setLoading(false);
        setEditingTask(null);
        setIsDialogOpen(false);
        setTimeout(() => setSuccessMessage(""), 3000);
        setTimeout(() => setErrorMessage(""), 3000);
    };

    // Marcar como concluída
    const handleTaskComplete = async (task) => {
        task.completed = true;

        try {
            const response = await fetch("/api/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(task),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage("Task completed successfully!");
            } else {
                setErrorMessage(`Error: ${data.error}`);
            }

            setTasks((prevTasks) =>
                prevTasks.map((t) => (t.id === data.id ? data : t))
            );
        } catch (error) {
            setErrorMessage("Error while completing task.");
        }

        setTimeout(() => setSuccessMessage(""), 3000);
        setTimeout(() => setErrorMessage(""), 3000);
    };

    // Deletar uma tarefa
    const handleDeleteTask = async (id) => {
        try {
            const response = await fetch("/api/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage("Task deleted successfully!");
            } else {
                setErrorMessage(`Error: ${data.error}`);
            }

            setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));
        } catch (error) {
            setErrorMessage("Error while deleting task.");
        }

        setTimeout(() => setSuccessMessage(""), 3000);
        setTimeout(() => setErrorMessage(""), 3000);
    };

    // Abrir o modal para edição
    const handleEditTask = (task) => {
        setEditingTask(task);
        setValue("id", task.id);
        setValue("title", task.title);
        setValue("description", task.description);
        setIsDialogOpen(true);
    };

    useEffect(() => {
        loadTasks();
    }, []);

    return (
        <div className="p-6 mx-auto space-y-4 flex flex-col items-center justify-center min-h-screen">
            {/* Dialog para criar ou editar uma task */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        className="bg-green-600 hover:bg-green-500"
                        onClick={() => setEditingTask(null)}
                    >
                        <Plus />
                        New Task
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTask ? "Edit Task" : "New Task"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingTask
                                ? "Update the task details and save."
                                : "Create a new task here. Click save when you're done."}
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="grid gap-4 py-4"
                    >
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="title"
                                {...register("title", {
                                    required: "Task name is required",
                                })}
                                className="col-span-3"
                                placeholder="Task name"
                            />
                            {errors.name && (
                                <p className="text-red-500 col-span-4">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Input
                                id="description"
                                {...register("description", {
                                    required: "Task description is required",
                                })}
                                className="col-span-3"
                                placeholder="Task description"
                            />
                            {errors.description && (
                                <p className="text-red-500 col-span-4">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>
                        <DialogFooter className="sm:justify-end">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Close
                                </Button>
                            </DialogClose>
                            <Button type="submit">
                                {editingTask ? "Save Changes" : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {successMessage && (
                <div className="bg-green-100 text-green-700 p-2 rounded">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-100 text-red-700 p-2 rounded">
                    {errorMessage}
                </div>
            )}

            {/* Lista de tarefas */}
            <div className="border rounded-lg p-4 w-full max-w-4xl break-words whitespace-normal">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map((task) => (
                            <TableRow
                                key={task.id}
                                className={`hover:bg-gray-200 ${
                                    task.completed
                                        ? "bg-green-100 text-green-700"
                                        : ""
                                }`}
                            >
                                <TableCell>{task.title}</TableCell>
                                <TableCell>{task.description}</TableCell>
                                <TableCell className="flex gap-1 flex-wrap justify-end items-center">
                                    <Button
                                        className="p-3"
                                        onClick={() =>
                                            handleDeleteTask(task.id)
                                        }
                                    >
                                        <Trash2 />
                                    </Button>
                                    <Button
                                        className="p-3"
                                        onClick={() => handleEditTask(task)}
                                    >
                                        <Pencil />
                                    </Button>
                                    <Button
                                        className="p-3"
                                        onClick={() => handleTaskComplete(task)}
                                        disabled={task.completed}
                                    >
                                        <Check />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter className="bg-transparent">
                        <TableRow>
                            <TableCell className="pt-6 font-semibold">
                                Total tasks:{" "}
                                <span className="font-bold">
                                    {tasks.length}
                                </span>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </div>
    );
}
