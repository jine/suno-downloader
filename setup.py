from setuptools import setup, find_packages

setup(
    name="suno-downloader",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "requests>=2.31.0",
    ],
    entry_points={
        "console_scripts": [
            "suno-download=suno_downloader.__main__:main",
        ],
    },
    python_requires=">=3.8",
)
