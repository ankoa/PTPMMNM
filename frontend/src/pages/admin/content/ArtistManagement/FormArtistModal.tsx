import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import Select from "react-select";
import "./FormArtistModal.scss";
import { useGenre } from "../../../../hooks/useGenre";
import { useArtist } from "../../../../hooks/useArtist";
import { Artist, Genre } from "../../../../types/music";

interface FormArtistModalProps {
  show: boolean;
  onClose: () => void;
  id?: number | null;
}
export interface CreateArtistRequest {
  name: string;
  bio?: string;
  image?: string | File | null;
  genres: number[]; // mảng các genre ID
  slug?: string;
}

export interface UpdateArtistRequest {
  name?: string;
  bio?: string;
  image?: string | File | null;
  genres?: number[];
  slug?: string;
}

const FormArtistModal: React.FC<FormArtistModalProps> = ({
  show,
  onClose,
  id,
}) => {
  const { genres, getGenres } = useGenre();
  const { getArtistById, createArtist, updateArtist } = useArtist();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [showFullImage, setShowFullImage] = useState(false);
  const [artist, setArtist] = useState({
    name: "",
    bio: "",
    image: null as File | string | null, // Cập nhật kiểu dữ liệu cho ảnh
    genres: [] as number[], // Dùng ID thay vì string[]
  });
  const resetForm = () => {
    setArtist({
      name: "",
      bio: "",
      image: null,
      genres: [],
    });
    setShowFullImage(false);
  };

  const fetchArtist = useCallback(
    async (id: number) => {
      try {
        const response = await getArtistById(id);
        if (!response) {
          toast.error("Artist not found.");
          return;
        }

        const artistData: Artist = response;

        setArtist({
          name: artistData.name || "",
          bio: artistData.bio || "",
          image: artistData.image || "", // Cập nhật đúng cách cho ảnh
          genres: artistData.genres?.map((g) => g.id) || [], // Map sang ID
        });

        toast.info("Artist loaded for editing.");
      } catch {
        toast.error("Failed to load artist data.");
      }
    },
    [getArtistById],
  );

  useEffect(() => {
    getGenres();
    if (id) fetchArtist(id);
  }, [getGenres, fetchArtist, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setArtist((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArtist((prev) => ({ ...prev, image: file }));
    }
  };
  const getImagePreview = (): string | undefined => {
    if (artist.image instanceof File) {
      return URL.createObjectURL(artist.image);
    }
    if (typeof artist.image === "string") {
      return artist.image;
    }
    return undefined;
  };

  const handleGenresChange = (selected: any) => {
    setArtist((prev) => ({
      ...prev,
      genres: selected ? selected.map((opt: any) => opt.value) : [],
    }));
  };

  /* const handleSubmit = async () => {
    const { name, bio, image, genres } = artist;

    // Kiểm tra các trường bắt buộc
    if (!name.trim()) return toast.error("Artist name is required.");
    if (!bio.trim()) return toast.error("Artist bio is required.");
    if (!genres.length)
      return toast.error("At least one genre must be selected.");

    try {
      // Chuẩn bị dữ liệu FormData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      if (image) formData.append("image", image);

      // Sử dụng genre_ids để gửi danh sách ID thể loại
      genres.forEach((genreId) =>
        formData.append("genre_ids", genreId.toString()),
      );

      // Kiểm tra nếu có ID thì thực hiện PUT (cập nhật) còn không thì POST (tạo mới)
      const response = id
        ? await axios.put(
            `http://127.0.0.1:8000/api/artists/${id}/`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            },
          ) // Cập nhật
        : await axios.post("http://127.0.0.1:8000/api/artists/", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }); // Tạo mới

      // Kiểm tra phản hồi và thông báo thành công
      if (response.status === 200 || response.status === 201) {
        toast.success(
          id ? "Artist updated successfully!" : "Artist added successfully!",
        );
        onClose();
      }
    } catch (error: any) {
      console.error("Error submitting artist:", error);

      // Hiển thị lỗi chi tiết nếu có
      if (error.response) {
        console.error("Error Response:", error.response);
        if (error.response.data) {
          toast.error(
            `Failed to save artist: ${JSON.stringify(error.response.data)}`,
          );
        } else {
          toast.error("Failed to save artist due to unknown error.");
        }
      } else {
        toast.error("Failed to save artist due to network or server issue.");
      }
    }
  }; */
  const handleSubmit = async () => {
    const { name, bio, image, genres } = artist;

    if (!name.trim()) return toast.error("Artist name is required.");
    if (!bio.trim()) return toast.error("Artist bio is required.");
    if (!genres.length)
      return toast.error("At least one genre must be selected.");

    // Tạo base object trước
    const artistData: CreateArtistRequest | UpdateArtistRequest = {
      name,
      bio,
      genres,
    };

    // Xử lý image
    if (image && typeof image !== "string") {
      artistData.image = image; // File mới được chọn
    } else if (!id && !image) {
      // Nếu đang tạo mới mà không có ảnh thì vẫn để null để tránh lỗi
      artistData.image = null;
    }

    try {
      let result;

      if (id) {
        result = await updateArtist(id, artistData as UpdateArtistRequest);
      } else {
        result = await createArtist(artistData as CreateArtistRequest);
      }

      if (result) {
        toast.success(
          id ? "Artist updated successfully!" : "Artist added successfully!",
        );
        onClose();
      }
    } catch (error) {
      toast.error("Something went wrong when saving the artist.");
      console.error(error);
    }
  };

  const genreOptions = genres.map((g: Genre) => ({
    value: g.id,
    label: g.name,
  }));

  return (
    <>
      <div className={`overlay ${show ? "show" : ""}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5>{id ? "Edit Artist" : "Add Artist"}</h5>
            <button
              className="close-button"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label>Name</label>
              <input
                className="input"
                type="text"
                name="name"
                placeholder="Enter artist name"
                value={artist.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <input
                className="input"
                type="text"
                name="bio"
                placeholder="Enter artist bio"
                value={artist.bio}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Genres</label>
              <Select
                isMulti
                name="genres"
                options={genreOptions}
                value={genreOptions.filter((opt) =>
                  artist.genres.includes(opt.value),
                )}
                onChange={handleGenresChange}
                placeholder="Select genres"
              />
            </div>

            <div className="form-row">
              <div className="form-group full">
                <label>Artist Image</label>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef} // nếu bạn có dùng ref
                />

                {getImagePreview() && (
                  <img
                    src={getImagePreview()}
                    alt="Artist"
                    className="thumbnail"
                    onClick={() => setShowFullImage(true)}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Close
            </button>
            <button className="button" onClick={handleSubmit}>
              {id ? "Update Artist" : "Save Artist"}
            </button>
          </div>
        </div>
      </div>

      {showFullImage && (
        <div className="image-overlay" onClick={() => setShowFullImage(false)}>
          <div className="image-popup" onClick={(e) => e.stopPropagation()}>
            {artist.image && (
              <img
                src={
                  typeof artist.image === "string"
                    ? artist.image
                    : URL.createObjectURL(artist.image)
                }
                alt="Full Artist"
              />
            )}
          </div>
          <button
            className="image-close-button"
            onClick={() => setShowFullImage(false)}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};
export default FormArtistModal;
