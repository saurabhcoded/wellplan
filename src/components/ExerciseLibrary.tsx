import { useState, useEffect } from 'react';
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Tag,
  Image,
  Video,
  FileImage,
  X,
  Save,
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  description: string;
  tags: string[];
  media_url: string;
  media_type: "gif" | "youtube" | "image";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function ExerciseLibrary() {
  const { userRole, user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
    media_url: "",
    media_type: "image" as "gif" | "youtube" | "image",
  });
  const [tagInput, setTagInput] = useState("");

  const isAdmin = userRole === "admin";

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin || !user) return;

    try {
      if (editingExercise) {
        // Update existing exercise
        const { error } = await supabase
          .from("exercise_library")
          .update({
            name: formData.name,
            description: formData.description,
            tags: formData.tags,
            media_url: formData.media_url,
            media_type: formData.media_type,
          })
          .eq("id", editingExercise.id);

        if (error) throw error;
      } else {
        // Create new exercise
        const { error } = await supabase.from("exercise_library").insert([
          {
            ...formData,
            created_by: user.id,
          },
        ]);

        if (error) throw error;
      }

      // Reset form and refresh
      resetForm();
      fetchExercises();
      toast.success(
        editingExercise
          ? "Exercise updated successfully!"
          : "Exercise created successfully!"
      );
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast.error("Error saving exercise. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;

    const result = await Swal.fire({
      title: "Delete Exercise?",
      text: "This will permanently remove this exercise from the library.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      background: "#1e293b",
      color: "#fff",
      customClass: {
        popup: "rounded-xl border border-slate-700",
        title: "text-xl",
        htmlContainer: "text-slate-300",
      },
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from("exercise_library")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchExercises();
      toast.success("Exercise deleted successfully!");
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast.error("Error deleting exercise. Please try again.");
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      description: exercise.description,
      tags: exercise.tags,
      media_url: exercise.media_url,
      media_type: exercise.media_type,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      tags: [],
      media_url: "",
      media_type: "image",
    });
    setTagInput("");
    setEditingExercise(null);
    setShowForm(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // Get all unique tags
  const allTags = Array.from(new Set(exercises.flatMap((ex) => ex.tags)));

  // Filter exercises
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch =
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || exercise.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading exercises..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Exercise Library</h1>
          <p className="text-slate-400 mt-1">
            {isAdmin
              ? "Manage your exercise database"
              : "Browse available exercises"}
          </p>
        </div>
        {isAdmin && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <Plus className="w-5 h-5" />
            Add Exercise
          </button>
        )}
      </div>

      {/* Exercise Form Modal (Admin Only) */}
      {isAdmin && showForm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={resetForm}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingExercise ? "Edit Exercise" : "Add New Exercise"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Exercise Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Barbell Bench Press"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Describe the exercise, form tips, etc."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="e.g., chest, beginner, strength"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Media Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Media Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["image", "gif", "youtube"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, media_type: type })
                      }
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition ${
                        formData.media_type === type
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {type === "image" && <Image className="w-4 h-4" />}
                      {type === "gif" && <FileImage className="w-4 h-4" />}
                      {type === "youtube" && <Video className="w-4 h-4" />}
                      <span className="capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Media URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Media URL
                </label>
                <input
                  type="url"
                  value={formData.media_url}
                  onChange={(e) =>
                    setFormData({ ...formData, media_url: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  <Save className="w-5 h-5" />
                  {editingExercise ? "Update Exercise" : "Create Exercise"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800 text-white border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  !selectedTag
                    ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                All
              </button>
              {(showAllTags ? allTags : allTags.slice(0, 5)).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${
                    selectedTag === tag
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              ))}
              {allTags.length > 5 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="px-3 py-1 rounded-full text-sm bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
                >
                  {showAllTags ? "Show Less" : `+${allTags.length - 5} More`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredExercises.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            {exercises.length === 0
              ? "No exercises yet. Add your first exercise!"
              : "No exercises found matching your search."}
          </div>
        ) : (
          filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-slate-800 rounded-lg sm:rounded-xl border border-slate-700 overflow-hidden hover:border-blue-500 transition cursor-pointer"
              onClick={() => setViewingExercise(exercise)}
            >
              {/* Media Preview */}
              {exercise.media_url && (
                <div className="aspect-video bg-slate-900 flex items-center justify-center">
                  {exercise.media_type === "youtube" ? (
                    <Video className="w-8 h-8 sm:w-12 sm:h-12 text-slate-600" />
                  ) : (
                    <img
                      src={exercise.media_url}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
              )}

              <div className="p-2 sm:p-4">
                <h3 className="text-sm sm:text-lg font-semibold text-white mb-1 sm:mb-2 line-clamp-2">
                  {exercise.name}
                </h3>

                {exercise.description && (
                  <p className="hidden sm:block text-sm text-slate-400 mb-3 line-clamp-2 lg:line-clamp-3">
                    {exercise.description}
                  </p>
                )}

                {exercise.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                    {exercise.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 sm:px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] sm:text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {exercise.tags.length > 2 && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-[10px] sm:text-xs">
                        +{exercise.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {isAdmin && (
                  <div className="flex gap-1 sm:gap-2 pt-2 sm:pt-3 border-t border-slate-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(exercise);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition text-xs sm:text-sm"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(exercise.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Exercise Modal */}
      {viewingExercise && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingExercise(null)}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {viewingExercise.name}
                </h2>
                <button
                  onClick={() => setViewingExercise(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Media */}
              {viewingExercise.media_url && (
                <div className="rounded-lg overflow-hidden bg-slate-900">
                  {viewingExercise.media_type === "youtube" ? (
                    <div className="aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${
                          viewingExercise.media_url.includes("youtu.be")
                            ? viewingExercise.media_url.split("/").pop()
                            : viewingExercise.media_url
                                .split("v=")[1]
                                ?.split("&")[0]
                        }`}
                        title={viewingExercise.name}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <img
                      src={viewingExercise.media_url}
                      alt={viewingExercise.name}
                      className="w-full h-auto"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.alt = "Failed to load image";
                      }}
                    />
                  )}
                </div>
              )}

              {/* Description */}
              {viewingExercise.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Description
                  </h3>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {viewingExercise.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {viewingExercise.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingExercise.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Info */}
              {viewingExercise.media_url && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Media Type
                  </h3>
                  <div className="flex items-center gap-2 text-slate-300">
                    {viewingExercise.media_type === "image" && (
                      <>
                        <Image className="w-4 h-4" />
                        <span>Image</span>
                      </>
                    )}
                    {viewingExercise.media_type === "gif" && (
                      <>
                        <FileImage className="w-4 h-4" />
                        <span>GIF</span>
                      </>
                    )}
                    {viewingExercise.media_type === "youtube" && (
                      <>
                        <Video className="w-4 h-4" />
                        <span>YouTube Video</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingExercise(null);
                      handleEdit(viewingExercise);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Exercise
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingExercise(null);
                      handleDelete(viewingExercise.id);
                    }}
                    className="px-4 py-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

